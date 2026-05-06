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
from shared.utils.logging import Event
from shared.utils.redis import get_pubsub, listen

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
        auctions = await AuctionRepository.get_all()
        for auction in auctions:
            auction_id = auction.auction_id
            if auction.status == Status.COMPLETED:
                continue
            if auction_id in cls._auctions:
                continue
            if not auction.preset_snapshot:
                continue
            await cls._setup_auction(auction_id, auction)
            logger.bind(
                event=Event(
                    Event.Type.AUCTION_SERVICE,
                    result={"auction_id": auction_id},
                    detail={"request_type": AuctionRequestType.RECOVER},
                )
            ).log("INFO", "")

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
        await listen(cls._pubsub, cls._handle_message)

    @classmethod
    async def _handle_message(cls, message: dict) -> None:
        if message["channel"] == "auction:request":
            envelope = AuctionRequestEnvelopeDTO.model_validate_json(message["data"])
            if envelope.type != AuctionRequestType.CREATE:
                return
            payload = CreateRequestPayloadDTO.model_validate(envelope.payload)
            auction_id = payload.auction_id
            if auction_id in cls._auctions:
                return
            repo = AuctionRepository(auction_id)
            await repo.set(preset_snapshot=payload.preset_snapshot)
            auction = await repo.get_detail()
            if not auction:
                return
            await repo.publish_create_response()
            await cls._setup_auction(auction_id, auction)
            logger.bind(
                event=Event(
                    Event.Type.AUCTION_SERVICE,
                    input={"payload": payload},
                    result={"auction_id": auction_id},
                    detail={"request_type": AuctionRequestType.CREATE},
                )
            ).log("INFO", "")
        else:
            parts = message["channel"].split(":")
            auction_id = int(parts[1])
            auction = cls._auctions.get(auction_id)
            if auction is None:
                return
            envelope = AuctionRequestEnvelopeDTO.model_validate_json(message["data"])
            await auction.handle_request(envelope)
