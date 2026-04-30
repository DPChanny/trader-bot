from typing import Any

from shared.dtos.auction import (
    AuctionCommandEnvelopeDTO,
    AuctionCommandType,
    CreateRequestPayloadDTO,
)
from shared.repositories.auction_repository import BaseAuctionRepository
from shared.utils.redis import get_redis


class AuctionRepository(BaseAuctionRepository):
    async def subscribe(self, pubsub: Any) -> None:
        await pubsub.subscribe(self._key("event"), self._key("response"))

    async def unsubscribe(self, pubsub: Any) -> None:
        await pubsub.unsubscribe(self._key("event"), self._key("response"))

    async def publish_request(
        self, request_type: AuctionCommandType, payload: Any | None = None
    ) -> None:
        await get_redis().publish(
            self._key("request"),
            AuctionCommandEnvelopeDTO(
                type=request_type, payload=payload
            ).model_dump_json(),
        )

    @classmethod
    async def publish_create_request(cls, payload: CreateRequestPayloadDTO) -> None:
        await get_redis().publish(
            "auction:request",
            AuctionCommandEnvelopeDTO(
                type=AuctionCommandType.CREATE, payload=payload
            ).model_dump_json(),
        )

    @classmethod
    async def await_create_response(cls, auction_id: int, timeout: int = 5) -> bool:
        result = await get_redis().blpop(
            f"auction:response:{auction_id}", timeout=timeout
        )
        return result is not None
