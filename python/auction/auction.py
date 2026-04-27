import asyncio

from loguru import logger

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionEventType,
    AuctionRequestEnvelopeDTO,
    AuctionRequestType,
    BidDTO,
    LeaderConnectedEventPayloadDTO,
    LeaderConnectedRequestPayloadDTO,
    LeaderDisconnectedEventPayloadDTO,
    LeaderDisconnectedRequestPayloadDTO,
    MemberSoldEventPayloadDTO,
    MemberUnsoldEventPayloadDTO,
    Status,
    StatusEventPayloadDTO,
    TickEventPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_pubsub

from .auction_repository import AuctionRepository


_TICK_INTERVAL = 10
_PENDING_DELAY = 5


class Auction:
    def __init__(self, detail: AuctionDetailDTO, ttl: int) -> None:
        self.auction_id = detail.auction_id
        self.preset_snapshot: PresetDetailDTO = detail.preset_snapshot
        self.repo = AuctionRepository(detail.auction_id)
        self._pubsub = get_pubsub()
        self._ttl = ttl
        self._status = detail.status
        self._player_id = detail.player_id
        self._current_bid = detail.bid
        self._teams = detail.teams
        self._auction_queue = detail.auction_queue
        self._unsold_queue = detail.unsold_queue

    @property
    def _team_size(self) -> int:
        return len(self.preset_snapshot.preset_members) // len(
            [pm for pm in self.preset_snapshot.preset_members if pm.is_leader]
        )

    async def run(self) -> None:
        timer = self.preset_snapshot.timer
        leader_count = sum(
            1 for pm in self.preset_snapshot.preset_members if pm.is_leader
        )

        try:
            await self.repo.subscribe(self._pubsub)
            async with asyncio.timeout(self._ttl):
                if self._status in (Status.WAITING, Status.PENDING):
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
                            req = LeaderConnectedRequestPayloadDTO.model_validate(
                                envelope.payload
                            )
                            count = await self.repo.increment_connected_leader_count()
                            await self.repo.publish_event(
                                AuctionEventType.LEADER_CONNECTED,
                                LeaderConnectedEventPayloadDTO(
                                    leader_id=req.leader_id,
                                    connected_leader_count=count,
                                ),
                            )
                            if count >= leader_count:
                                break
                        elif envelope.type == AuctionRequestType.LEADER_DISCONNECTED:
                            req = LeaderDisconnectedRequestPayloadDTO.model_validate(
                                envelope.payload
                            )
                            count = await self.repo.increment_connected_leader_count(-1)
                            await self.repo.publish_event(
                                AuctionEventType.LEADER_DISCONNECTED,
                                LeaderDisconnectedEventPayloadDTO(
                                    leader_id=req.leader_id,
                                    connected_leader_count=count,
                                ),
                            )

                    await self.repo.set_status(Status.PENDING)
                    await self.repo.publish_event(
                        AuctionEventType.STATUS,
                        StatusEventPayloadDTO(status=Status.PENDING),
                    )
                    await asyncio.sleep(_PENDING_DELAY)

                await self.repo.set_status(Status.RUNNING)
                await self.repo.publish_event(
                    AuctionEventType.STATUS,
                    StatusEventPayloadDTO(status=Status.RUNNING),
                )

                while True:
                    next_result = await self.repo.next_player(
                        self._auction_queue, self._unsold_queue, self._teams
                    )
                    if next_result is None:
                        break
                    self._player_id, self._auction_queue, self._unsold_queue = (
                        next_result
                    )
                    self._current_bid = None

                    async def _tick() -> None:
                        remaining = timer
                        while remaining > 0:
                            await asyncio.sleep(min(_TICK_INTERVAL, remaining))
                            remaining -= _TICK_INTERVAL
                            if remaining > 0:
                                await self.repo.publish_event(
                                    AuctionEventType.TICK,
                                    TickEventPayloadDTO(timer=int(remaining)),
                                )

                    tick = asyncio.create_task(_tick())
                    try:
                        async with asyncio.timeout(timer):
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
                                        bid = BidDTO.model_validate(envelope.payload)
                                        if self._player_id is not None:
                                            placed = await self.repo.place_bid(
                                                bid, self._player_id, self._team_size
                                            )
                                            if placed:
                                                self._current_bid = bid
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
                            MemberSoldEventPayloadDTO(
                                player_id=self._player_id,
                                leader_id=self._current_bid.leader_id,
                                amount=self._current_bid.amount,
                            ),
                        )
                    elif self._player_id:
                        await self.repo.push_unsold(self._player_id)
                        await self.repo.publish_event(
                            AuctionEventType.MEMBER_UNSOLD,
                            MemberUnsoldEventPayloadDTO(player_id=self._player_id),
                        )

                await self.repo.set_status(Status.COMPLETED)
                await self.repo.publish_event(
                    AuctionEventType.STATUS,
                    StatusEventPayloadDTO(status=Status.COMPLETED),
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
            await self.repo.unsubscribe(self._pubsub)
            await self._pubsub.close()
