import json
import uuid
from typing import ClassVar

from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction


class AuctionManager:
    _local_auctions: ClassVar[dict[int, Auction]] = {}

    @classmethod
    async def create_auction(
        cls, preset_snapshot: PresetDetailDTO, is_public: bool
    ) -> Auction:
        auction_id = uuid.uuid4().int
        auction = Auction(
            auction_id=auction_id, preset_snapshot=preset_snapshot, is_public=is_public
        )
        cls._local_auctions[auction_id] = auction

        # Store auction metadata in Redis for discovery
        r = get_redis()
        await r.sadd("active_auctions", str(auction_id))
        await r.setex(
            f"auction:{auction_id}:meta",
            60 * 60 * 24,  # 24 hours
            json.dumps(
                {
                    "is_public": is_public,
                    "preset_id": preset_snapshot.preset_id,
                    "guild_id": preset_snapshot.guild_id,
                }
            ),
        )

        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        # Check local cache first
        if auction_id in cls._local_auctions:
            return cls._local_auctions[auction_id]

        # If not local, we might need to "hydrate" it from Redis
        # (This will be fully implemented when Auction state is in Redis)
        r = get_redis()
        if await r.sismember("active_auctions", str(auction_id)):
            # For now, if it's in Redis but not local, we might have a problem
            # because we don't have the preset_snapshot here easily.
            # In the full Redis implementation, we'll store the snapshot in Redis too.
            pass

        return cls._local_auctions.get(auction_id)

    @classmethod
    async def remove_auction(cls, auction_id: int) -> None:
        cls._local_auctions.pop(auction_id, None)
        r = get_redis()
        await r.srem("active_auctions", str(auction_id))
        await r.delete(f"auction:{auction_id}:meta")
