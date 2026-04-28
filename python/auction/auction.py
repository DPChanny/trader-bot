import asyncio
import contextlib
from collections.abc import Callable

from loguru import logger

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionRequestEnvelopeDTO,
    AuctionRequestType,
    BidDTO,
    LeaderConnectedRequestPayloadDTO,
    LeaderDisconnectedRequestPayloadDTO,
    Status,
)
from shared.utils.redis import get_pubsub

from .auction_repository import AuctionRepository


class Auction:
    def __init__(
        self, detail: AuctionDetailDTO, on_done: Callable[[], None] | None = None
    ) -> None:
        self.auction_id = detail.auction_id
        self.repo = AuctionRepository(detail.auction_id)
        self._pubsub = get_pubsub()
        self._task = asyncio.create_task(self._main(detail))
        if on_done:
            self._task.add_done_callback(lambda _: on_done())

    async def cancel(self) -> None:
        self._task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await self._task

    async def _main(self, detail: AuctionDetailDTO) -> None:
        try:
            await self.repo.subscribe(self._pubsub)
            async with asyncio.timeout(detail.ttl):
                if detail.status in (Status.WAITING, Status.PENDING):
                    await self._wait(len(detail.teams))

                await self._pend()
                await self._run(detail)

                await self.repo.publish_status(Status.COMPLETED)
                logger.info(f"Auction {self.auction_id} completed")

        except TimeoutError:
            await self.repo.publish_status(Status.COMPLETED)
            logger.warning(f"Auction {self.auction_id} expired")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Auction {self.auction_id} error: {type(e).__name__}: {e}")
        finally:
            await self.repo.unsubscribe(self._pubsub)
            await self._pubsub.close()

    async def _wait(self, team_count: int) -> None:
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
                if count >= team_count:
                    break
            elif envelope.type == AuctionRequestType.LEADER_DISCONNECTED:
                req = LeaderDisconnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                await self.repo.publish_leader_disconnected(req.leader_id)

    async def _pend(self) -> None:
        await self.repo.publish_status(Status.PENDING)
        await asyncio.sleep(5)

    async def _run(self, detail: AuctionDetailDTO) -> None:
        await self.repo.publish_status(Status.RUNNING)

        timer = detail.preset_snapshot.timer
        team_size = detail.preset_snapshot.team_size
        teams = detail.teams
        auction_queue = detail.auction_queue
        unsold_queue = detail.unsold_queue

        while True:
            next_result = await self.repo.next_player(
                auction_queue, unsold_queue, teams
            )
            if next_result is None:
                break
            player_id, auction_queue, unsold_queue = next_result

            bid = await self._recept(timer, player_id, team_size)

            if bid and player_id:
                team = next((t for t in teams if t.leader_id == bid.leader_id), None)
                if team:
                    team.member_ids.append(player_id)
                    team.points -= bid.amount
                    await self.repo.publish_member_sold(team, player_id, bid)
            elif player_id:
                await self.repo.publish_member_unsold(player_id)

    async def _recept(
        self, timer: int, player_id: int, team_size: int
    ) -> BidDTO | None:
        bid: BidDTO | None = None

        async def _tick() -> None:
            remaining = timer
            while remaining > 0:
                await asyncio.sleep(min(100, remaining))
                remaining -= 100
                if remaining > 0:
                    await self.repo.publish_tick(int(remaining))

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
                            b = BidDTO.model_validate(envelope.payload)
                            placed = await self.repo.place_bid(b, player_id, team_size)
                            if placed:
                                bid = b
                        except Exception:
                            continue
        except TimeoutError:
            pass
        finally:
            tick.cancel()

        return bid
