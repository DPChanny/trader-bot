import asyncio
import contextlib

from loguru import logger

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
from shared.utils.logging import Event, logging_context

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
        async with logging_context({"auction_id": self.auction_id}):
            try:
                async with asyncio.timeout(dto.ttl):
                    if dto.status == Status.WAITING:
                        await self._wait(len(dto.teams))
                    if dto.status in (Status.WAITING, Status.PENDING):
                        await self._pend()
                    await self._run(dto)

                    await self._repo.publish_status(Status.COMPLETED)
                    logger.bind(
                        event=Event(
                            Event.Type.AUCTION_SERVICE,
                            result={"status": Status.COMPLETED},
                            detail={"type": AuctionPublishType.STATUS},
                        )
                    ).log("INFO", "")

            except TimeoutError:
                await self._repo.publish_status(Status.COMPLETED)
                logger.bind(
                    event=Event(
                        Event.Type.AUCTION_SERVICE,
                        result={"status": Status.COMPLETED},
                        detail={"type": AuctionPublishType.STATUS},
                    )
                ).log("WARNING", "")
            except asyncio.CancelledError:
                pass
            except Exception as e:
                app_error = AppError(UnexpectedErrorCode.Internal)
                app_error.__cause__ = e
                handle_app_error(app_error)

    async def _wait(self, team_count: int) -> None:
        await self._repo.publish_status(Status.WAITING)
        logger.bind(
            event=Event(
                Event.Type.AUCTION_SERVICE,
                result={"status": Status.WAITING},
                detail={"type": AuctionPublishType.STATUS},
            )
        ).log("INFO", "")

        while True:
            envelope = await self._queue.get()
            if envelope.type == AuctionRequestType.LEADER_CONNECTED:
                payload = LeaderConnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                connected_leader_count = await self._repo.publish_leader_connected(
                    payload.leader_id
                )
                logger.bind(
                    event=Event(
                        Event.Type.AUCTION_SERVICE,
                        input={"payload": payload},
                        result={"connected_leader_count": connected_leader_count},
                        detail={"type": AuctionRequestType.LEADER_CONNECTED},
                    )
                ).log("INFO", "")
                if connected_leader_count >= team_count:
                    break
            elif envelope.type == AuctionRequestType.LEADER_DISCONNECTED:
                payload = LeaderDisconnectedRequestPayloadDTO.model_validate(
                    envelope.payload
                )
                await self._repo.publish_leader_disconnected(payload.leader_id)
                logger.bind(
                    event=Event(
                        Event.Type.AUCTION_SERVICE,
                        input={"payload": payload},
                        detail={"type": AuctionRequestType.LEADER_DISCONNECTED},
                    )
                ).log("INFO", "")

    async def _pend(self) -> None:
        await self._repo.publish_status(Status.PENDING)
        logger.bind(
            event=Event(
                Event.Type.AUCTION_SERVICE,
                result={"status": Status.PENDING},
                detail={"type": AuctionPublishType.STATUS},
            )
        ).log("INFO", "")
        await asyncio.sleep(5)

    async def _run(self, dto: AuctionDetailDTO) -> None:
        await self._repo.publish_status(Status.RUNNING)
        logger.bind(
            event=Event(
                Event.Type.AUCTION_SERVICE,
                result={"status": Status.RUNNING},
                detail={"type": AuctionPublishType.STATUS},
            )
        ).log("INFO", "")

        timer = dto.preset_snapshot.timer
        team_size = dto.preset_snapshot.team_size

        while True:
            player_id = await self._repo.next_player()
            if player_id is None:
                break
            logger.bind(
                event=Event(
                    Event.Type.AUCTION_SERVICE,
                    result={"player_id": player_id},
                    detail={"type": AuctionPublishType.NEXT_PLAYER},
                )
            ).log("INFO", "")

            bid = await self._recept(timer, player_id, team_size)

            if bid:
                await self._repo.publish_member_sold(bid.leader_id, player_id, bid)
                logger.bind(
                    event=Event(
                        Event.Type.AUCTION_SERVICE,
                        input={"bid": bid},
                        result={"player_id": player_id},
                        detail={"type": AuctionPublishType.MEMBER_SOLD},
                    )
                ).log("INFO", "")
            else:
                await self._repo.publish_member_unsold(player_id)
                logger.bind(
                    event=Event(
                        Event.Type.AUCTION_SERVICE,
                        result={"player_id": player_id},
                        detail={"type": AuctionPublishType.MEMBER_UNSOLD},
                    )
                ).log("INFO", "")

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
                                logger.bind(
                                    event=Event(
                                        Event.Type.AUCTION_SERVICE,
                                        input={"bid": _bid},
                                        result={"bid": bid},
                                        detail={"type": AuctionRequestType.PLACE_BID},
                                    )
                                ).log("INFO", "")
                            else:
                                logger.bind(
                                    event=Event(
                                        Event.Type.AUCTION_SERVICE,
                                        input={"bid": _bid},
                                        result={"bid": bid},
                                        detail={"type": AuctionRequestType.PLACE_BID},
                                    )
                                ).log("DEBUG", "")
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
