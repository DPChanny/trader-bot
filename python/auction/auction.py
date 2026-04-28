import asyncio

from loguru import logger

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionEventType,
    AuctionRequestEnvelopeDTO,
    AuctionRequestType,
    BidDTO,
    LeaderConnectedRequestPayloadDTO,
    LeaderDisconnectedRequestPayloadDTO,
    Status,
    TickEventPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_pubsub

from .auction_repository import AuctionRepository


class Auction:
    def __init__(self, detail: AuctionDetailDTO, ttl: int) -> None:
        self.auction_id = detail.auction_id
        self.preset_snapshot: PresetDetailDTO = detail.preset_snapshot
        self.repo = AuctionRepository(detail.auction_id)
        self._pubsub = get_pubsub()
        self._ttl = ttl
        self._status = detail.status
        self._player_id = detail.player_id
        self._bid = detail.bid
        self._teams = detail.teams
        self._auction_queue = detail.auction_queue
        self._unsold_queue = detail.unsold_queue
        self._team_size = self.preset_snapshot.team_size

    async def main(self) -> None:
        try:
            await self.repo.subscribe(self._pubsub)
            async with asyncio.timeout(self._ttl):
                if self._status in (Status.WAITING, Status.PENDING):
                    await self._wait()

                await self.repo.publish_status(Status.RUNNING)
                await self._run()

                await self.repo.publish_status(Status.COMPLETED)
                logger.info(f"Auction {self.auction_id} completed")

        except TimeoutError:
            logger.warning(f"Auction {self.auction_id} expired")
            await self.repo.publish_status(Status.COMPLETED)
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Auction {self.auction_id} error: {type(e).__name__}: {e}")
        finally:
            await self.repo.unsubscribe(self._pubsub)
            await self._pubsub.close()

    async def _wait(self) -> None:
        await self.repo.publish_status(Status.WAITING)

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
                req = LeaderConnectedRequestPayloadDTO.model_validate(envelope.payload)
                count = await self.repo.publish_leader_connected(req.leader_id)
                if count >= len(self._teams):
                    break
            elif envelope.type == AuctionRequestType.LEADER_DISCONNECTED:
                req = LeaderDisconnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                count = await self.repo.publish_leader_disconnected(req.leader_id)

        await self.repo.publish_status(Status.PENDING)
        await asyncio.sleep(5)

    async def _run(self) -> None:
        timer = self.preset_snapshot.timer

        while True:
            next_result = await self.repo.next_player(
                self._auction_queue, self._unsold_queue, self._teams
            )
            if next_result is None:
                break
            self._player_id, self._auction_queue, self._unsold_queue = next_result
            self._bid = None

            await self._recept(timer)

            if self._bid and self._player_id:
                team = next(
                    (t for t in self._teams if t.leader_id == self._bid.leader_id), None
                )
                if team:
                    team.member_ids.append(self._player_id)
                    team.points -= self._bid.amount
                    await self.repo.publish_member_sold(
                        team, self._player_id, self._bid
                    )
            elif self._player_id:
                await self.repo.publish_member_unsold(self._player_id)

    async def _recept(self, timer: int) -> None:
        async def _tick() -> None:
            remaining = timer
            while remaining > 0:
                await asyncio.sleep(min(100, remaining))
                remaining -= 100
                if remaining > 0:
                    await self.repo.publish_event(
                        AuctionEventType.TICK, TickEventPayloadDTO(timer=int(remaining))
                    )

        tick = asyncio.create_task(_tick())
        try:
            async with asyncio.timeout(timer):
                async for message in self._pubsub.listen():
                    if message["type"] != "message":
                        continue
                    try:
                        envelope = AuctionRequestEnvelopeDTO.model_validate_json(
                            message["data"]
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
                                    self._bid = bid
                        except Exception:
                            continue
        except TimeoutError:
            pass
        finally:
            tick.cancel()
