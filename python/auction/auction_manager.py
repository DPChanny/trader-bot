import asyncio
import contextlib
from typing import Any, ClassVar

from loguru import logger

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionRequestEnvelopeDTO,
    AuctionRequestType,
    CreateRequestPayloadDTO,
    Status,
)
from shared.utils.redis import get_pubsub
from shared.utils.redis import listen as _listen

from .auction import Auction
from .auction_repository import AuctionRepository


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
        auctions = list(cls._auctions.values())
        cls._auctions.clear()
        for auction in auctions:
            await auction.cancel()
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
            await cls._setup_auction(auction_id, detail)

    @classmethod
    async def _setup_auction(cls, auction_id: int, detail: AuctionDetailDTO) -> None:
        await AuctionRepository(auction_id).subscribe(cls._pubsub)
        auction = Auction(detail)
        cls._auctions[auction_id] = auction
        asyncio.create_task(cls._cleanup_auction(auction_id, auction))

    @classmethod
    async def _cleanup_auction(cls, auction_id: int, auction: Auction) -> None:
        await auction.wait()
        cls._auctions.pop(auction_id, None)
        with contextlib.suppress(Exception):
            await AuctionRepository(auction_id).unsubscribe(cls._pubsub)

    @classmethod
    async def _listener(cls) -> None:
        while True:
            try:
                async for message in _listen(cls._pubsub):
                    if message.channel == "auction:request":
                        try:
                            envelope = AuctionRequestEnvelopeDTO.model_validate_json(
                                message.data
                            )
                        except Exception:
                            continue

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

                        repo = AuctionRepository(auction_id)
                        await repo.set(preset_snapshot=payload.preset_snapshot)
                        detail = await repo.get_detail()
                        if not detail:
                            continue
                        await repo.publish_create_response()
                        await cls._setup_auction(auction_id, detail)
                    else:
                        parts = message.channel.split(":")
                        if len(parts) != 3:
                            continue
                        try:
                            auction_id = int(parts[1])
                        except ValueError:
                            continue
                        auction = cls._auctions.get(auction_id)
                        if auction is None:
                            continue
                        try:
                            envelope = AuctionRequestEnvelopeDTO.model_validate_json(
                                message.data
                            )
                            await auction.handle_request(envelope)
                        except Exception:
                            continue
            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.error(f"Manager listener error: {type(e).__name__}: {e}")
            await asyncio.sleep(1)
