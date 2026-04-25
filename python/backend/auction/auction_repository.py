from __future__ import annotations

import json
from typing import Any

from shared.dtos.auction import AuctionMessageType
from shared.utils.redis import get_redis

from .auction import Team


_AUCTION_LIFETIME = 3600


class AuctionRepository:
    def __init__(self, auction_id: int) -> None:
        self._id = auction_id

    def _key(self, suffix: str = "") -> str:
        return f"auction:{self._id}{suffix}"

    async def load(self) -> dict | None:
        r = get_redis()
        data = await r.hgetall(self._key())
        if not data:
            return None
        teams_raw = await r.hgetall(self._key(":teams"))
        aq_raw = await r.lrange(self._key(":auction_queue"), 0, -1)
        uq_raw = await r.lrange(self._key(":unsold_queue"), 0, -1)
        return {
            "state": data,
            "teams": teams_raw,
            "auction_queue": aq_raw,
            "unsold_queue": uq_raw,
        }

    async def save(
        self, state_mapping: dict, teams: list[Team], auction_queue: list[int]
    ) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(self._key(), mapping=state_mapping)
            pipe.expire(self._key(), _AUCTION_LIFETIME)
            for team in teams:
                pipe.hset(
                    self._key(":teams"), str(team.team_id), team.model_dump_json()
                )
            pipe.expire(self._key(":teams"), _AUCTION_LIFETIME)
            if auction_queue:
                pipe.rpush(self._key(":auction_queue"), *auction_queue)
                pipe.expire(self._key(":auction_queue"), _AUCTION_LIFETIME)
            await pipe.execute()

    async def get_connected_member_ids(self) -> set[int]:
        r = get_redis()
        raw = await r.smembers(self._key(":connected_member_ids"))
        return {int(x) for x in raw}

    async def queue_lengths(self) -> tuple[int, int]:
        r = get_redis()
        aq_len = await r.llen(self._key(":auction_queue"))
        uq_len = await r.llen(self._key(":unsold_queue"))
        return aq_len, uq_len

    async def get_all_queue_members(self) -> tuple[list[int], list[int]]:
        r = get_redis()
        aq = [int(x) for x in await r.lrange(self._key(":auction_queue"), 0, -1)]
        uq = [int(x) for x in await r.lrange(self._key(":unsold_queue"), 0, -1)]
        return aq, uq

    async def get_next_in_queue(self) -> int | None:
        r = get_redis()
        val = await r.lindex(self._key(":auction_queue"), 0)
        return int(val) if val else None

    async def acquire_state_lock(self) -> bool:
        r = get_redis()
        return bool(
            await r.set(self._key(":state_lock"), "1", nx=True, ex=_AUCTION_LIFETIME)
        )

    async def acquire_timer_lock(self) -> bool:
        r = get_redis()
        return bool(await r.set(self._key(":timer_lock"), "1", nx=True, ex=10))

    async def subscribe(self, pubsub: Any) -> None:
        await pubsub.subscribe(self._key(":event"))

    async def emit(
        self,
        event_type: AuctionMessageType,
        payload: dict,
        *,
        hset: dict | None = None,
        hset_teams: dict | None = None,
        lpop_aq: bool = False,
        rpush_uq: int | None = None,
        del_uq: bool = False,
        rpush_aq: list[int] | None = None,
        sadd_connected: int | None = None,
        srem_connected: int | None = None,
        del_state_lock: bool = False,
    ) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            if hset:
                pipe.hset(self._key(), mapping=hset)
            if hset_teams:
                for team_id, val in hset_teams.items():
                    pipe.hset(self._key(":teams"), str(team_id), val)
            if lpop_aq:
                pipe.lpop(self._key(":auction_queue"))
            if rpush_uq is not None:
                pipe.rpush(self._key(":unsold_queue"), rpush_uq)
            if del_uq:
                pipe.delete(self._key(":unsold_queue"))
            if rpush_aq:
                pipe.rpush(self._key(":auction_queue"), *rpush_aq)
            if sadd_connected is not None:
                pipe.sadd(self._key(":connected_member_ids"), sadd_connected)
            if srem_connected is not None:
                pipe.srem(self._key(":connected_member_ids"), srem_connected)
            if del_state_lock:
                pipe.delete(self._key(":state_lock"))
            pipe.publish(
                self._key(":event"),
                json.dumps({"type": event_type.value, "payload": payload}),
            )
            await pipe.execute()

    async def emit_recycle_and_next(self, uq_members: list[int]) -> None:
        member_id = uq_members[0]
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.delete(self._key(":unsold_queue"))
            pipe.rpush(self._key(":auction_queue"), *uq_members)
            pipe.lpop(self._key(":auction_queue"))
            pipe.hset(
                self._key(),
                mapping={
                    "player_id": str(member_id),
                    "bid_amount": "",
                    "bid_leader_id": "",
                },
            )
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {
                        "type": AuctionMessageType.NEXT_MEMBER.value,
                        "payload": {"member_id": member_id},
                    }
                ),
            )
            await pipe.execute()

    async def emit_forced_fill(self, team_id: int, team_json: str) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                self._key(),
                mapping={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
            )
            pipe.hset(self._key(":teams"), str(team_id), team_json)
            pipe.delete(self._key(":auction_queue"))
            pipe.delete(self._key(":unsold_queue"))
            pipe.publish(
                self._key(":event"),
                json.dumps(
                    {"type": AuctionMessageType.MEMBER_SOLD.value, "payload": {}}
                ),
            )
            await pipe.execute()
