import asyncio
from typing import Any, ClassVar

from loguru import logger

from shared.dtos.auction import AuctionRequestType, CreateRequestPayloadDTO, Status
from shared.utils.redis import get_pubsub

from .auction import Auction
from .auction_repository import AuctionRepository
from .utils import listen


class AuctionManager:
    _pubsub: ClassVar[Any] = None
    _auctions: ClassVar[dict[int, Auction]] = {}
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
            await cls._listener_task
        for auction in cls._auctions.values():
            await auction.cancel()
        cls._auctions.clear()
        if cls._pubsub:
            await cls._pubsub.close()

    @classmethod
    async def _recover(cls) -> None:
        all_auctions = await AuctionRepository.get_all()
        for auction_id, detail in all_auctions:
            if detail.status == Status.COMPLETED:
                continue
            if auction_id in cls._auctions:
                continue
            if not detail.preset_snapshot:
                logger.warning(
                    f"Recovery: auction {auction_id} has no preset_snapshot, skipping"
                )
                continue
            logger.info(f"Recovering auction {auction_id}")
            cls._auctions[auction_id] = Auction(
                detail, on_done=lambda aid=auction_id: cls._auctions.pop(aid, None)
            )

    @classmethod
    async def _listener(cls) -> None:
        while True:
            try:
                async for envelope in listen(cls._pubsub):
                    if envelope.type != AuctionRequestType.CREATE:
                        continue

                    try:
                        payload = CreateRequestPayloadDTO.model_validate(
                            envelope.payload
                        )
                    except Exception:
                        continue

                    auction_id = payload.auction_id
                    if auction_id in cls._auctions:
                        continue

                    preset = payload.preset_snapshot

                    repo = AuctionRepository(auction_id)
                    await repo.set(preset_snapshot=preset)
                    detail = await repo.get_detail()
                    if not detail:
                        continue
                    await repo.publish_create_response()
                    cls._auctions[auction_id] = Auction(
                        detail,
                        on_done=lambda aid=auction_id: cls._auctions.pop(aid, None),
                    )
            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.error(f"Manager listener error: {type(e).__name__}: {e}")
            await asyncio.sleep(1)
