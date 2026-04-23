import json
import uuid
from typing import Any, ClassVar

from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction, Bid, Team


class AuctionManager:
    _local_auctions: ClassVar[dict[int, Auction]] = {}

    @classmethod
    async def _on_redis_event(cls, channel: str, data: Any):
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
        async with r.pipeline(transaction=True) as pipe:
            # 1. Sync State
            data = {
                "status": auction.status.value,
                "current_member_id": str(auction.current_member_id or ""),
                "current_bid_amount": str(auction.current_bid.amount) if auction.current_bid else "",
                "current_bid_leader_id": str(auction.current_bid.leader_id) if auction.current_bid else "",
                "expires_at": auction.expires_at.isoformat() if auction.expires_at else "",
                "teams": json.dumps([t.__dict__ for t in auction.teams])
            }
            pipe.hset(f"auction:{auction_id}", mapping=data)

            pipe.delete(f"auction:{auction_id}:queue")
            if auction.auction_queue:
                pipe.rpush(f"auction:{auction_id}:queue", *[str(m) for m in auction.auction_queue])

            pipe.delete(f"auction:{auction_id}:unsold")
            if auction.unsold_queue:
                pipe.rpush(f"auction:{auction_id}:unsold", *[str(m) for m in auction.unsold_queue])

            # 2. Publish Event
            pipe.publish("auctions:event", json.dumps({
                "auction_id": auction_id,
                "type": event_type,
                "payload": payload
            }))

            await pipe.execute()

    @classmethod
    async def create_auction(cls, preset_snapshot: PresetDetailDTO, is_public: bool) -> Auction:
        auction_id = uuid.uuid4().int
        auction = Auction(auction_id, preset_snapshot, is_public, cls._publish_and_sync)
        cls._local_auctions[auction_id] = auction

        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.sadd("auctions", str(auction_id))
            pipe.hset(f"auction:{auction_id}", mapping={
                "is_public": str(is_public),
                "preset_snapshot": preset_snapshot.model_dump_json(),
                "status": auction.status.value,
                "current_member_id": "",
                "current_bid_amount": "",
                "current_bid_leader_id": "",
                "expires_at": "",
                "teams": json.dumps([t.__dict__ for t in auction.teams])
            })
            if auction.auction_queue:
                pipe.delete(f"auction:{auction_id}:queue")
                pipe.rpush(f"auction:{auction_id}:queue", *[str(m) for m in auction.auction_queue])
            await pipe.execute()

        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._local_auctions:
            return cls._local_auctions[auction_id]

        r = get_redis()
        if not await r.sismember("auctions", str(auction_id)):
            return None

        # Multiple reads still need multiple awaits if not using pipeline for fetch
        # But for loading, we can use pipeline to get everything at once
        async with r.pipeline(transaction=False) as pipe:
            pipe.hgetall(f"auction:{auction_id}")
            pipe.lrange(f"auction:{auction_id}:queue", 0, -1)
            pipe.lrange(f"auction:{auction_id}:unsold", 0, -1)
            results = await pipe.execute()

        data, queue, unsold = results
        if not data:
            return None

        preset_snapshot = PresetDetailDTO.model_validate_json(data["preset_snapshot"])
        auction = Auction(auction_id, preset_snapshot, data["is_public"] == "True", cls._publish_and_sync)

        auction.status = Auction.Status(int(data["status"]))
        auction.current_member_id = int(data["current_member_id"]) if data.get("current_member_id") else None
        if data.get("current_bid_amount") and data.get("current_bid_leader_id"):
            auction.current_bid = Bid(int(data["current_bid_amount"]), int(data["current_bid_leader_id"]))
        if data.get("expires_at"):
            from datetime import datetime
            auction.expires_at = datetime.fromisoformat(data["expires_at"])
        if data.get("teams"):
            auction.teams = [Team(**t) for t in json.loads(data["teams"])]

        auction.auction_queue = [int(m) for m in queue]
        auction.unsold_queue = [int(m) for m in unsold]

        cls._local_auctions[auction_id] = auction
        return auction

    @classmethod
    async def remove_auction(cls, auction_id: int) -> None:
        cls._local_auctions.pop(auction_id, None)
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.srem("auctions", str(auction_id))
            pipe.delete(f"auction:{auction_id}", f"auction:{auction_id}:queue", f"auction:{auction_id}:unsold")
            await pipe.execute()
