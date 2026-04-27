import asyncio
from typing import Any, ClassVar

from loguru import logger
from pydantic import ValidationError

from shared.dtos.auction import (
    AUCTION_LIFETIME,
    AuctionRequestEnvelopeDTO,
    AuctionRequestType,
    Status,
)
from shared.utils.redis import get_pubsub

from .auction import Auction
from .auction_repository import AuctionRepository


class AuctionManager:
    _pubsub: ClassVar[Any] = None
    _loops: ClassVar[dict[int, asyncio.Task]] = {}
    _listener_task: ClassVar[asyncio.Task | None] = None

    @classmethod
    async def setup(cls) -> None:
        cls._pubsub = get_pubsub()
        await cls._pubsub.subscribe("auction:request")
        cls._listener_task = asyncio.create_task(cls._listener())
        await cls._recover()

    @classmethod
    async def cleanup(cls) -> None:
        if cls._listener_task:
            cls._listener_task.cancel()
            with asyncio.suppress(asyncio.CancelledError):
                await cls._listener_task
        for task in cls._loops.values():
            task.cancel()
        if cls._loops:
            await asyncio.gather(*cls._loops.values(), return_exceptions=True)
        cls._loops.clear()
        await cls._pubsub.close()

    @classmethod
    def _run_auction(cls, auction_id: int, auction: Auction) -> None:
        task = asyncio.create_task(auction.main())
        cls._loops[auction_id] = task
        task.add_done_callback(lambda t, aid=auction_id: cls._loops.pop(aid, None))

    @classmethod
    async def _recover(cls) -> None:
        all_auctions = await AuctionRepository.get_all()
        for auction_id, detail in all_auctions:
            if detail.status == Status.COMPLETED:
                continue
            if auction_id in cls._loops:
                continue
            if not detail.preset_snapshot:
                logger.warning(
                    f"Recovery: auction {auction_id} has no preset_snapshot, skipping"
                )
                continue
            logger.info(f"Recovering auction {auction_id}")
            ttl = await AuctionRepository(auction_id).get_ttl()
            cls._run_auction(auction_id, Auction(detail, ttl))

    @classmethod
    async def _listener(cls) -> None:
        while True:
            try:
                async for message in cls._pubsub.listen():
                    if message["type"] != "message":
                        continue
                    try:
                        envelope = AuctionRequestEnvelopeDTO.model_validate_json(
                            message["data"]
                        )
                    except ValidationError, Exception:
                        continue

                    if envelope.type != AuctionRequestType.CREATE:
                        continue

                    from shared.dtos.auction import CreateRequestPayloadDTO

                    try:
                        payload = CreateRequestPayloadDTO.model_validate(
                            envelope.payload
                        )
                    except ValidationError, Exception:
                        logger.error("Invalid CREATE request payload")
                        continue

                    auction_id = payload.auction_id
                    if auction_id in cls._loops:
                        logger.warning(f"Auction {auction_id} already running")
                        continue

                    preset = payload.preset_snapshot

                    repo = AuctionRepository(auction_id)
                    await repo.set(preset_snapshot=preset)
                    detail = await repo.get_detail()
                    if not detail:
                        continue
                    await repo.publish_create_response()
                    cls._run_auction(auction_id, Auction(detail, AUCTION_LIFETIME))
            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.error(f"Manager listener error: {type(e).__name__}: {e}")
            await asyncio.sleep(1)
