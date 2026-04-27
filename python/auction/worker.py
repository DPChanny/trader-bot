import asyncio

from loguru import logger

from shared.dtos.auction import (
    AUCTION_LIFETIME,
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    AuctionRequestEnvelopeDTO,
    AuctionRequestType,
    BidDTO,
    BidPlacedPayloadDTO,
    MemberSoldPayloadDTO,
    MemberUnsoldPayloadDTO,
    NextPlayerPayloadDTO,
    Status,
    StatusPayloadDTO,
    TeamDTO,
    TickPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode
from shared.utils.redis import get_pubsub_redis, get_redis

from .repository import AuctionWorkerRepository
from .scripts import NEXT_PLAYER_SCRIPT, PLACE_BID_SCRIPT


_TICK_INTERVAL = 10
_PENDING_DELAY = 5


class AuctionWorker:
    def __init__(
        self, auction_id: int, preset_snapshot: PresetDetailDTO, *, resume: bool = False
    ) -> None:
        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot
        self.resume = resume
        self.repo = AuctionWorkerRepository(auction_id)
        self._pubsub = get_pubsub_redis().pubsub()
        self._player_id: int | None = None
        self._current_bid: BidDTO | None = None
        self._teams: list[TeamDTO] = []
        self._auction_queue: list[int] = []
        self._unsold_queue: list[int] = []

    def _key(self, suffix: str = "") -> str:
        if suffix:
            return f"auction:{self.auction_id}:{suffix}"
        return f"auction:{self.auction_id}"

    @property
    def _team_size(self) -> int:
        return len(self.preset_snapshot.preset_members) // len(
            [pm for pm in self.preset_snapshot.preset_members if pm.is_leader]
        )

    # ── main flow ─────────────────────────────────────────────────────────────

    async def run(self) -> None:
        ttl = AUCTION_LIFETIME if not self.resume else await self.repo.get_ttl()
        bid_timer = self.preset_snapshot.timer
        leader_count = sum(
            1 for pm in self.preset_snapshot.preset_members if pm.is_leader
        )

        try:
            await self.repo.subscribe_request(self._pubsub)
            async with asyncio.timeout(ttl):
                detail = await self.repo.get_detail()
                if not detail:
                    return

                self._teams = detail.teams
                self._auction_queue = detail.auction_queue
                self._unsold_queue = detail.unsold_queue
                self._player_id = detail.player_id
                self._current_bid = detail.bid

                if not self.resume:
                    await self.repo.publish_create_response()

                if not self.resume or detail.status in (Status.WAITING, Status.PENDING):
                    await self.repo.set_status(Status.WAITING)

                    async for message in self._pubsub.listen():
                        if message["type"] != "message":
                            continue
                        try:
                            envelope = AuctionRequestEnvelopeDTO.model_validate_json(
                                message["data"]
                            )
                        except Exception:
                            continue
                        if envelope.type == AuctionRequestType.LEADER_CONNECTED:
                            if (
                                await self.repo.increment_connected_leader_count()
                                >= leader_count
                            ):
                                break
                        elif envelope.type == AuctionRequestType.LEADER_DISCONNECTED:
                            await self.repo.increment_connected_leader_count(-1)

                    await self.repo.set_status(Status.PENDING)
                    await self.repo.publish_event(
                        AuctionEventType.STATUS, StatusPayloadDTO(status=Status.PENDING)
                    )
                    await asyncio.sleep(_PENDING_DELAY)

                await self.repo.set_status(Status.RUNNING)
                await self.repo.publish_event(
                    AuctionEventType.STATUS, StatusPayloadDTO(status=Status.RUNNING)
                )

                while await self._next_player():

                    async def _tick() -> None:
                        remaining = bid_timer
                        while remaining > 0:
                            await asyncio.sleep(min(_TICK_INTERVAL, remaining))
                            remaining -= _TICK_INTERVAL
                            if remaining > 0:
                                await self.repo.publish_event(
                                    AuctionEventType.TICK,
                                    TickPayloadDTO(timer=int(remaining)),
                                )

                    tick = asyncio.create_task(_tick())
                    try:
                        async with asyncio.timeout(bid_timer):
                            async for message in self._pubsub.listen():
                                if message["type"] != "message":
                                    continue
                                try:
                                    envelope = (
                                        AuctionRequestEnvelopeDTO.model_validate_json(
                                            message["data"]
                                        )
                                    )
                                except Exception:
                                    continue
                                if envelope.type == AuctionRequestType.PLACE_BID:
                                    try:
                                        await self._place_bid(
                                            BidDTO.model_validate(envelope.payload)
                                        )
                                    except Exception:
                                        continue
                    except TimeoutError:
                        pass
                    finally:
                        tick.cancel()

                    if self._current_bid and self._player_id:
                        team = next(
                            (
                                t
                                for t in self._teams
                                if t.leader_id == self._current_bid.leader_id
                            ),
                            None,
                        )
                        if team:
                            team.member_ids.append(self._player_id)
                            team.points -= self._current_bid.amount
                            await self.repo.update_team(team)
                        await self.repo.publish_event(
                            AuctionEventType.MEMBER_SOLD,
                            MemberSoldPayloadDTO(
                                player_id=self._player_id,
                                leader_id=self._current_bid.leader_id,
                                amount=self._current_bid.amount,
                            ),
                        )
                    elif self._player_id:
                        await self.repo.push_unsold(self._player_id)
                        await self.repo.publish_event(
                            AuctionEventType.MEMBER_UNSOLD,
                            MemberUnsoldPayloadDTO(player_id=self._player_id),
                        )

                await self.repo.set_status(Status.COMPLETED)
                await self.repo.publish_event(
                    AuctionEventType.STATUS, StatusPayloadDTO(status=Status.COMPLETED)
                )
                logger.info(f"Auction {self.auction_id} completed")

        except TimeoutError:
            logger.warning(f"Auction {self.auction_id} expired")
            await self.repo.set_status(Status.COMPLETED)
            await self.repo.publish_event(AuctionEventType.EXPIRED)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Auction {self.auction_id} error: {type(e).__name__}: {e}")
        finally:
            await self.repo.unsubscribe_request(self._pubsub)
            await self._pubsub.close()

    async def _next_player(self) -> bool:
        if self._auction_queue:
            next_player_id = self._auction_queue[0]
            new_queue = self._auction_queue[1:]
            new_unsold = self._unsold_queue
        elif self._unsold_queue:
            next_player_id = self._unsold_queue[0]
            new_queue = self._unsold_queue[1:]
            new_unsold = []
        else:
            return False

        envelope = AuctionEventEnvelopeDTO(
            type=AuctionEventType.NEXT_PLAYER,
            payload=NextPlayerPayloadDTO(
                player_id=next_player_id,
                teams=self._teams,
                auction_queue=new_queue,
                unsold_queue=new_unsold,
            ),
        ).model_dump_json()

        r = get_redis()
        result = await r.eval(
            NEXT_PLAYER_SCRIPT,
            4,
            self._key("auction_queue"),
            self._key("unsold_queue"),
            self._key(),
            self._key("event"),
            envelope,
        )
        if not result:
            return False

        self._player_id = next_player_id
        self._auction_queue = new_queue
        self._unsold_queue = new_unsold
        self._current_bid = None
        return True

    async def _place_bid(self, bid: BidDTO) -> None:
        if not self._player_id:
            return

        bid_placed_event = AuctionEventEnvelopeDTO(
            type=AuctionEventType.BID_PLACED,
            payload=BidPlacedPayloadDTO(
                leader_id=bid.leader_id, amount=bid.amount, player_id=self._player_id
            ),
        ).model_dump_json()

        r = get_redis()

        result = await r.eval(
            PLACE_BID_SCRIPT,
            3,
            self._key(),
            self._key("teams"),
            self._key("event"),
            str(bid.leader_id),
            str(bid.amount),
            str(self._team_size),
            bid_placed_event,
            str(AuctionErrorCode.BidInvalidState),
            str(AuctionErrorCode.BidTeamFull),
            str(AuctionErrorCode.BidInvalidAmount),
        )
        if result != 0:
            await self.repo.publish_bid_error(bid.leader_id, int(result))
        else:
            self._current_bid = bid
