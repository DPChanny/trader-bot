from collections.abc import AsyncIterator

from redis.asyncio.client import PubSub

from shared.dtos.auction import AuctionRequestEnvelopeDTO
from shared.utils.redis import listen as _listen


async def listen(pubsub: PubSub) -> AsyncIterator[AuctionRequestEnvelopeDTO]:
    async for message in _listen(pubsub):
        try:
            yield AuctionRequestEnvelopeDTO.model_validate_json(message.data)
        except Exception:
            continue
