from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from typing import Any

from shared.dtos.auction import AuctionMessageType, Status
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction, Bid, Team


_AUCTION_LIFETIME = 3600

_RECYCLE_SCRIPT = """
    local unsold_queue = redis.call('LRANGE', KEYS[1], 0, -1)
    redis.call('DEL', KEYS[1])
    redis.call('RPUSH', KEYS[2], unpack(unsold_queue))
    redis.call('LPOP', KEYS[2])
    redis.call('HSET', KEYS[3], 'player_id', unsold_queue[1], 'bid_amount', '', 'bid_leader_id', '')
    redis.call('PUBLISH', KEYS[4], ARGV[1])
"""


class AuctionRepository:
    def __init__(self, auction_id: int) -> None:
        self.auction_id = auction_id

    def _key(self, suffix: str = "") -> str:
        return f"auction:{self.auction_id}{suffix}"

    async def load(
        self, on_expire: Callable[[], Awaitable[None]], pubsub: Any
    ) -> Auction | None:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.hgetall(self._key())
            pipe.hgetall(self._key(":teams"))
            pipe.lrange(self._key(":auction_queue"), 0, -1)
            pipe.lrange(self._key(":unsold_queue"), 0, -1)
            data, teams_raw, aq_raw, uq_raw = await pipe.execute()
        if not data:
            return None
        preset_snapshot = PresetDetailDTO.model_validate_json(data["preset_snapshot"])
        teams = [Team.model_validate_json(v) for v in teams_raw.values()]
        bid = (
            Bid(amount=int(data["bid_amount"]), leader_id=int(data["bid_leader_id"]))
            if data.get("bid_amount")
            else None
        )
        auction = Auction(
            auction_id=self.auction_id,
            preset_snapshot=preset_snapshot,
            teams=teams,
            auction_queue=[int(x) for x in aq_raw],
            unsold_queue=[int(x) for x in uq_raw],
            status=Status(int(data["status"])),
            player_id=int(data["player_id"]) if data.get("player_id") else None,
            bid=bid,
            on_expire=on_expire,
        )
        await pubsub.subscribe(self._key(":event"))
        return auction

    async def save(self, auction: Auction, pubsub: Any) -> None:
        r = get_redis()
        state_mapping = {
            "status": str(auction.status.value),
            "player_id": "",
            "bid_amount": "",
            "bid_leader_id": "",
            "preset_id": str(auction.preset_snapshot.preset_id),
            "guild_id": str(auction.preset_snapshot.guild_id),
            "preset_snapshot": auction.preset_snapshot.model_dump_json(),
        }
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(self._key(), mapping=state_mapping)
            pipe.expire(self._key(), _AUCTION_LIFETIME)
            for team in auction.teams:
                pipe.hset(
                    self._key(":teams"), str(team.team_id), team.model_dump_json()
                )
            pipe.expire(self._key(":teams"), _AUCTION_LIFETIME)
            if auction.auction_queue:
                pipe.rpush(self._key(":auction_queue"), *auction.auction_queue)
                pipe.expire(self._key(":auction_queue"), _AUCTION_LIFETIME)
            await pipe.execute()
        await pubsub.subscribe(self._key(":event"))

    async def publish_leader_connected(self) -> int:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.incr(self._key(":connected_leader_count"))
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {"type": AuctionMessageType.LEADER_CONNECTED.value, "payload": {}}
                ),
            )
            new_count, _ = await pipe.execute()
        return int(new_count)

    async def publish_leader_disconnected(self) -> None:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.decr(self._key(":connected_leader_count"))
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {
                        "type": AuctionMessageType.LEADER_DISCONNECTED.value,
                        "payload": {},
                    }
                ),
            )
            await pipe.execute()

    async def publish_next_player(self) -> bool:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.lindex(self._key(":auction_queue"), 0)
            pipe.llen(self._key(":unsold_queue"))
            next_player_id, unsold_queue_len = await pipe.execute()

        if next_player_id:
            async with r.pipeline(transaction=True) as pipe:
                pipe.hset(
                    self._key(),
                    mapping={
                        "player_id": next_player_id,
                        "bid_amount": "",
                        "bid_leader_id": "",
                    },
                )
                pipe.lpop(self._key(":auction_queue"))
                pipe.publish(
                    self._key(":event"),
                    json.dumps(
                        {"type": AuctionMessageType.NEXT_PLAYER.value, "payload": {}}
                    ),
                )
                await pipe.execute()
            return False

        if unsold_queue_len == 0:
            return True

        await r.eval(
            _RECYCLE_SCRIPT,
            4,
            self._key(":unsold_queue"),
            self._key(":auction_queue"),
            self._key(),
            self._key(":event"),
            json.dumps({"type": AuctionMessageType.NEXT_PLAYER.value, "payload": {}}),
        )
        return False

    async def acquire_state_lock(self) -> bool:
        r = get_redis()
        return bool(await r.set(self._key(":state_lock"), "1", nx=True))

    async def release_state_lock(self) -> None:
        r = get_redis()
        await r.delete(self._key(":state_lock"))

    async def acquire_timer_lock(self) -> bool:
        r = get_redis()
        return bool(await r.set(self._key(":timer_lock"), "1", nx=True))

    async def release_timer_lock(self) -> None:
        r = get_redis()
        await r.delete(self._key(":timer_lock"))

    async def publish_status(self, status: Status) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(self._key(), mapping={"status": str(status.value)})
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {
                        "type": AuctionMessageType.STATUS.value,
                        "payload": {"status": status.value},
                    }
                ),
            )
            await pipe.execute()

    async def publish_bid_placed(self, leader_id: int, amount: int) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={"bid_amount": str(amount), "bid_leader_id": str(leader_id)},
            )
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {
                        "type": AuctionMessageType.BID_PLACED.value,
                        "payload": {"leader_id": leader_id, "amount": amount},
                    }
                ),
            )
            await pipe.execute()

    async def publish_member_sold(self, team_id: int, team_json: str) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
            )
            pipe.hset(self._key(":teams"), str(team_id), team_json)
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {"type": AuctionMessageType.MEMBER_SOLD.value, "payload": {}}
                ),
            )
            await pipe.execute()

    async def publish_member_unsold(self, player_id: int) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
            )
            pipe.rpush(self._key(":unsold_queue"), player_id)
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {"type": AuctionMessageType.MEMBER_UNSOLD.value, "payload": {}}
                ),
            )
            await pipe.execute()
