import asyncio
import contextlib

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

from .auction_repository import AuctionRepository


class Auction:
    def __init__(self, dto: AuctionDetailDTO) -> None:
        self.auction_id = dto.auction_id
        self._repo = AuctionRepository(dto.auction_id)
        self._queue: asyncio.Queue[AuctionRequestEnvelopeDTO] = asyncio.Queue()
        self._task = asyncio.create_task(self._main(dto))

    async def cancel(self) -> None:
        self._task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await self._task

    async def wait(self) -> None:
        with contextlib.suppress(asyncio.CancelledError):
            await self._task

    async def handle_request(self, envelope: AuctionRequestEnvelopeDTO) -> None:
        await self._queue.put(envelope)

    async def _main(self, dto: AuctionDetailDTO) -> None:
        try:
            async with asyncio.timeout(dto.ttl):
                if dto.status == Status.WAITING:
                    await self._wait(len(dto.teams))
                if dto.status in (Status.WAITING, Status.PENDING):
                    await self._pend()
                await self._run(dto)

                await self._repo.publish_status(Status.COMPLETED)
                logger.info(f"Auction {self.auction_id} completed")

        except TimeoutError:
            await self._repo.publish_status(Status.COMPLETED)
            logger.warning(f"Auction {self.auction_id} expired")
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Auction {self.auction_id} error: {type(e).__name__}: {e}")

    async def _wait(self, team_count: int) -> None:
        await self._repo.publish_status(Status.WAITING)

        while True:
            envelope = await self._queue.get()
            if envelope.type == AuctionRequestType.LEADER_CONNECTED:
                request = LeaderConnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                connected_leader_count = await self._repo.publish_leader_connected(
                    request.leader_id
                )
                if connected_leader_count >= team_count:
                    break
            elif envelope.type == AuctionRequestType.LEADER_DISCONNECTED:
                request = LeaderDisconnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                await self._repo.publish_leader_disconnected(request.leader_id)

    async def _pend(self) -> None:
        await self._repo.publish_status(Status.PENDING)
        await asyncio.sleep(5)

    async def _run(self, dto: AuctionDetailDTO) -> None:
        await self._repo.publish_status(Status.RUNNING)

        timer = dto.preset_snapshot.timer
        team_size = dto.preset_snapshot.team_size

        while True:
            player_id = await self._repo.next_player()
            if player_id is None:
                break

            bid = await self._recept(timer, player_id, team_size)

            if bid:
                await self._repo.publish_member_sold(bid.leader_id, player_id, bid)
            else:
                await self._repo.publish_member_unsold(player_id)

    async def _recept(
        self, timer: int, player_id: int, team_size: int
    ) -> BidDTO | None:
        bid_placed = asyncio.Event()

        async def _listen() -> BidDTO | None:
            bid: BidDTO | None = None
            with contextlib.suppress(asyncio.CancelledError):
                while True:
                    envelope = await self._queue.get()
                    if envelope.type == AuctionRequestType.PLACE_BID:
                        try:
                            _bid = BidDTO.model_validate(envelope.payload)
                            is_bid_placed = await self._repo.place_bid(
                                _bid, player_id, team_size
                            )
                            if is_bid_placed:
                                bid = _bid
                                bid_placed.set()
                        except Exception:
                            continue
            return bid

        listen_task = asyncio.create_task(_listen())
        try:
            remaining = timer
            while remaining > 0:
                await asyncio.sleep(1)
                remaining -= 1
                if bid_placed.is_set():
                    bid_placed.clear()
                    remaining = timer
                await self._repo.publish_tick(remaining)
        finally:
            listen_task.cancel()
            await listen_task

        return listen_task.result()
