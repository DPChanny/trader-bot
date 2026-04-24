import json
import uuid
from typing import Any, ClassVar

from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction, Bid, Team


class AuctionManager:
    _local_auctions: ClassVar[dict[int, Auction]] = {}

    @classmethod
    async def _on_redis_event(cls, _: str, data: Any):
        auction_id = data.get("auction_id")
        event_type = data.get("type")
        payload = data.get("payload")

        auction = cls._local_auctions.get(auction_id)
        if auction:
            await auction.handle_redis_event(event_type, payload)

    @classmethod
    async def _publish_and_sync(cls, auction_id: int, event_type: str, payload: Any):
        auction = cls._local_auctions.get(auction_id)
        if not auction:
            return

        r = get_redis()
        data = {
            "status": str(auction.status.value),
            "current_member_id": str(auction.current_member_id or ""),
            "current_bid": json.dumps(auction.current_bid.__dict__)
            if auction.current_bid
            else "",
            "expires_at": auction.expires_at.isoformat() if auction.expires_at else "",
            "teams": json.dumps([t.__dict__ for t in auction.teams]),
            "auction_queue": json.dumps(auction.auction_queue),
            "unsold_queue": json.dumps(auction.unsold_queue),
        }
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(f"auction:{auction_id}", mapping=data)
            pipe.publish(
                "auctions:event",
                json.dumps(
                    {"auction_id": auction_id, "type": event_type, "payload": payload}
                ),
            )
            await pipe.execute()

    @classmethod
    async def create_auction(
        cls, preset_snapshot: PresetDetailDTO, is_public: bool
    ) -> Auction:
        auction_id = uuid.uuid4().int
        auction = Auction(auction_id, preset_snapshot, is_public, cls._publish_and_sync)
        cls._local_auctions[auction_id] = auction

        r = get_redis()
        key = f"auction:{auction_id}"
        data = {
            "preset_id": str(preset_snapshot.preset_id),
            "guild_id": str(preset_snapshot.guild_id),
            "is_public": str(is_public),
            "preset_snapshot": preset_snapshot.model_dump_json(),
            "status": str(auction.status.value),
            "current_member_id": "",
            "current_bid": "",
            "expires_at": "",
            "teams": json.dumps([t.__dict__ for t in auction.teams]),
            "auction_queue": json.dumps(auction.auction_queue),
            "unsold_queue": json.dumps(auction.unsold_queue),
        }
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(key, mapping=data)
            pipe.expire(key, 3600)
            await pipe.execute()

        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._local_auctions:
            return cls._local_auctions[auction_id]

        r = get_redis()
        data = await r.hgetall(f"auction:{auction_id}")
        if not data:
            return None

        preset_snapshot = PresetDetailDTO.model_validate_json(data["preset_snapshot"])
        auction = Auction(
            auction_id,
            preset_snapshot,
            data["is_public"] == "True",
            cls._publish_and_sync,
        )

        auction.status = Auction.Status(int(data["status"]))
        auction.current_member_id = (
            int(data["current_member_id"]) if data.get("current_member_id") else None
        )
        if data.get("current_bid"):
            bid_data = json.loads(data["current_bid"])
            auction.current_bid = Bid(**bid_data)
        if data.get("expires_at"):
            from datetime import datetime

            auction.expires_at = datetime.fromisoformat(data["expires_at"])
        if data.get("teams"):
            auction.teams = [Team(**t) for t in json.loads(data["teams"])]

        auction.auction_queue = json.loads(data.get("auction_queue", "[]"))
        auction.unsold_queue = json.loads(data.get("unsold_queue", "[]"))

        cls._local_auctions[auction_id] = auction
        return auction
