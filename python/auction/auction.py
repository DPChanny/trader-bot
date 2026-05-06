import asyncio
import contextlib

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionPublishType,
    AuctionRequestEnvelopeDTO,
    AuctionRequestType,
    BidDTO,
    LeaderConnectedRequestPayloadDTO,
    LeaderDisconnectedRequestPayloadDTO,
    Status,
)
from shared.utils.error import AppError, UnexpectedErrorCode, handle_app_error
from shared.utils.logging import logging_context

from .auction_repository import AuctionRepository
from .utils import log_publish, log_request


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
        async with logging_context({"auction_id": self.auction_id}):
            try:
                async with asyncio.timeout(dto.ttl):
                    if dto.status == Status.WAITING:
                        await self._wait(len(dto.teams))
                    if dto.status in (Status.WAITING, Status.PENDING):
                        await self._pend()
                    await self._run(dto)

                    await self._repo.publish_status(Status.COMPLETED)
                    log_publish(
                        AuctionPublishType.STATUS, result={"status": Status.COMPLETED}
                    )

            except TimeoutError:
                await self._repo.publish_status(Status.COMPLETED)
                log_publish(
                    AuctionPublishType.STATUS,
                    result={"status": Status.COMPLETED},
                    level="WARNING",
                )
            except asyncio.CancelledError:
                pass
            except Exception as e:
                app_error = AppError(UnexpectedErrorCode.Internal)
                app_error.__cause__ = e
                handle_app_error(app_error)

    async def _wait(self, team_count: int) -> None:
        await self._repo.publish_status(Status.WAITING)
        log_publish(AuctionPublishType.STATUS, result={"status": Status.WAITING})

        while True:
            envelope = await self._queue.get()
            if envelope.type == AuctionRequestType.LEADER_CONNECTED:
                payload = LeaderConnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                connected_leader_count = await self._repo.publish_leader_connected(
                    payload.leader_id
                )
                log_request(
                    AuctionRequestType.LEADER_CONNECTED,
                    input={"payload": payload},
                    result={"connected_leader_count": connected_leader_count},
                )
                if connected_leader_count >= team_count:
                    break
            elif envelope.type == AuctionRequestType.LEADER_DISCONNECTED:
                payload = LeaderDisconnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                connected_leader_count = await self._repo.publish_leader_disconnected(
                    payload.leader_id
                )
                log_request(
                    AuctionRequestType.LEADER_DISCONNECTED,
                    input={"payload": payload},
                    result={"connected_leader_count": connected_leader_count},
                )

    async def _pend(self) -> None:
        await self._repo.publish_status(Status.PENDING)
        log_publish(AuctionPublishType.STATUS, result={"status": Status.PENDING})
        await asyncio.sleep(5)

    async def _run(self, dto: AuctionDetailDTO) -> None:
        await self._repo.publish_status(Status.RUNNING)
        log_publish(AuctionPublishType.STATUS, result={"status": Status.RUNNING})

        timer = dto.preset_snapshot.timer
        team_size = dto.preset_snapshot.team_size

        while True:
            player_id = await self._repo.next_player()
            if player_id is None:
                break
            log_publish(AuctionPublishType.NEXT_PLAYER, result={"player_id": player_id})

            bid = await self._recept(timer, player_id, team_size)

            if bid:
                await self._repo.publish_member_sold(bid.leader_id, player_id, bid)
                log_publish(
                    AuctionPublishType.MEMBER_SOLD,
                    result={"player_id": player_id, "bid": bid},
                )
            else:
                await self._repo.publish_member_unsold(player_id)
                log_publish(
                    AuctionPublishType.MEMBER_UNSOLD, result={"player_id": player_id}
                )

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
                            payload = BidDTO.model_validate(envelope.payload)
                            is_bid_placed = await self._repo.place_bid(
                                payload, player_id, team_size
                            )
                            if is_bid_placed:
                                bid = payload
                                bid_placed.set()
                            log_request(
                                AuctionRequestType.PLACE_BID,
                                input={"payload": payload},
                                result={"bid": bid},
                            )
                        except Exception as e:
                            app_error = AppError(UnexpectedErrorCode.Internal)
                            app_error.__cause__ = e
                            handle_app_error(app_error)
                            continue
            return bid

        listen_task = asyncio.create_task(_listen())
        try:
            remaining = timer
            while remaining > 0:
                try:
                    await asyncio.wait_for(bid_placed.wait(), timeout=1)
                    bid_placed.clear()
                    remaining = timer
                except TimeoutError:
                    remaining -= 1
                await self._repo.publish_tick(remaining)
        finally:
            listen_task.cancel()
            await listen_task

        return listen_task.result()
