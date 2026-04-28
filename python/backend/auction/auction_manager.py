import asyncio
import uuid
from typing import Any, ClassVar

from loguru import logger
from pydantic import ValidationError

from shared.dtos.auction import (
    AuctionEventEnvelopeDTO,
    AuctionResponseEnvelopeDTO,
    CreateRequestPayloadDTO,
    Status,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode, HTTPError, UnexpectedErrorCode
from shared.utils.redis import get_pubsub, listen

from .auction import Auction
from .auction_repository import AuctionRepository


class AuctionManager:
    _auctions: ClassVar[dict[int, Auction]] = {}
    _pubsub: ClassVar[Any] = None
    _listener_task: ClassVar[asyncio.Task | None] = None

    @classmethod
    async def setup(cls) -> None:
        cls._pubsub = get_pubsub()
        await cls._pubsub.subscribe("auction:__listener__")
        cls._listener_task = asyncio.create_task(cls._listener())

    @classmethod
    async def cleanup(cls) -> None:
        if cls._listener_task:
            cls._listener_task.cancel()
            await cls._listener_task
        for auction in cls._auctions.values():
            auction.stop()
        cls._auctions.clear()
        if cls._pubsub:
            await cls._pubsub.close()

    @classmethod
    async def _listener(cls) -> None:
        while True:
            try:
                async for message in listen(cls._pubsub):
                    try:
                        parts = message.channel.split(":")
                        auction_id = int(parts[1])
                        auction = cls._auctions.get(auction_id)
                        if not auction:
                            continue

                        if message.channel.endswith(":response"):
                            envelope = AuctionResponseEnvelopeDTO.model_validate_json(
                                message.data
                            )
                        else:
                            envelope = AuctionEventEnvelopeDTO.model_validate_json(
                                message.data
                            )

                        is_completed = await auction.handle_event(envelope)
                        if is_completed:
                            cls._auctions.pop(auction_id, None)
                            repo = AuctionRepository(auction_id)
                            await repo.unsubscribe(cls._pubsub)
                    except ValueError, IndexError, KeyError, ValidationError:
                        continue
            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.error(f"Listener error: {type(e).__name__}: {e}")

            await asyncio.sleep(1)

    @classmethod
    async def create_auction(cls, preset_snapshot: PresetDetailDTO) -> Auction:
        auction_id = uuid.uuid4().int

        payload = CreateRequestPayloadDTO(
            auction_id=auction_id, preset_snapshot=preset_snapshot
        )
        await AuctionRepository.publish_create_request(payload)

        ok = await AuctionRepository.await_create_response(auction_id, timeout=5)
        if not ok:
            raise HTTPError(UnexpectedErrorCode.External)

        auction = Auction(auction_id=auction_id, preset_snapshot=preset_snapshot)
        cls._auctions[auction_id] = auction

        repo = AuctionRepository(auction_id)
        await repo.subscribe(cls._pubsub)

        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._auctions:
            return cls._auctions[auction_id]

        repo = AuctionRepository(auction_id)
        detail = await repo.get_detail()
        if not detail or not detail.preset_snapshot:
            return None
        auction = Auction(auction_id=auction_id, preset_snapshot=detail.preset_snapshot)
        if detail.status == Status.COMPLETED:
            return auction
        cls._auctions[auction_id] = auction
        await repo.subscribe(cls._pubsub)
        return auction
