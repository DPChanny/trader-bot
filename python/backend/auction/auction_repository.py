from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from typing import Any

from shared.dtos.auction import AuctionMessageType, Status
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction, Bid, Team


_AUCTION_LIFETIME = 3600


class AuctionRepository:
    @staticmethod
    def _key(auction_id: int, suffix: str = "") -> str:
        return f"auction:{auction_id}{suffix}"

    @classmethod
    async def load(
        cls, auction_id: int, on_expire: Callable[[], Awaitable[None]]
    ) -> Auction | None:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.hgetall(cls._key(auction_id))
            pipe.hgetall(cls._key(auction_id, ":teams"))
            pipe.lrange(cls._key(auction_id, ":auction_queue"), 0, -1)
            pipe.lrange(cls._key(auction_id, ":unsold_queue"), 0, -1)
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
        return Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            teams=teams,
            auction_queue=[int(x) for x in aq_raw],
            unsold_queue=[int(x) for x in uq_raw],
            status=Status(int(data["status"])),
            player_id=int(data["player_id"]) if data.get("player_id") else None,
            bid=bid,
            on_expire=on_expire,
        )

    @classmethod
    async def save(cls, auction: Auction) -> None:
        r = get_redis()
        aid = auction.auction_id
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
            pipe.hset(cls._key(aid), mapping=state_mapping)
            pipe.expire(cls._key(aid), _AUCTION_LIFETIME)
            for team in auction.teams:
                pipe.hset(
                    cls._key(aid, ":teams"), str(team.team_id), team.model_dump_json()
                )
            pipe.expire(cls._key(aid, ":teams"), _AUCTION_LIFETIME)
            if auction.auction_queue:
                pipe.rpush(cls._key(aid, ":auction_queue"), *auction.auction_queue)
                pipe.expire(cls._key(aid, ":auction_queue"), _AUCTION_LIFETIME)
            await pipe.execute()

    @classmethod
    async def incr_connected_leader_count_and_emit(
        cls, auction_id: int, event_type: AuctionMessageType
    ) -> int:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.incr(cls._key(auction_id, ":connected_leader_count"))
            pipe.publish(
                cls._key(auction_id, ":event"),
                json.dumps({"type": event_type.value, "payload": {}}),
            )
            new_count, _ = await pipe.execute()
        return int(new_count)

    @classmethod
    async def decr_connected_leader_count_and_emit(
        cls, auction_id: int, event_type: AuctionMessageType
    ) -> None:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.decr(cls._key(auction_id, ":connected_leader_count"))
            pipe.publish(
                cls._key(auction_id, ":event"),
                json.dumps({"type": event_type.value, "payload": {}}),
            )
            await pipe.execute()

    @classmethod
    async def peek_queues(cls, auction_id: int) -> tuple[int | None, list[int]]:
        r = get_redis()
        async with r.pipeline(transaction=False) as pipe:
            pipe.lindex(cls._key(auction_id, ":auction_queue"), 0)
            pipe.lrange(cls._key(auction_id, ":unsold_queue"), 0, -1)
            next_aq, uq_raw = await pipe.execute()
        return (int(next_aq) if next_aq else None), [int(x) for x in uq_raw]

    @classmethod
    async def acquire_state_lock(cls, auction_id: int) -> bool:
        r = get_redis()
        return bool(
            await r.set(
                cls._key(auction_id, ":state_lock"), "1", nx=True, ex=_AUCTION_LIFETIME
            )
        )

    @classmethod
    async def acquire_timer_lock(cls, auction_id: int) -> bool:
        r = get_redis()
        return bool(
            await r.set(cls._key(auction_id, ":timer_lock"), "1", nx=True, ex=10)
        )

    @classmethod
    async def subscribe(cls, auction_id: int, pubsub: Any) -> None:
        await pubsub.subscribe(cls._key(auction_id, ":event"))

    @classmethod
    async def emit(
        cls,
        auction_id: int,
        event_type: AuctionMessageType,
        payload: dict,
        *,
        hset: dict | None = None,
        hset_teams: dict | None = None,
        lpop_aq: bool = False,
        rpush_uq: int | None = None,
    ) -> None:
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            if hset:
                pipe.hset(cls._key(auction_id), mapping=hset)
            if hset_teams:
                for team_id, val in hset_teams.items():
                    pipe.hset(cls._key(auction_id, ":teams"), str(team_id), val)
            if lpop_aq:
                pipe.lpop(cls._key(auction_id, ":auction_queue"))
            if rpush_uq is not None:
                pipe.rpush(cls._key(auction_id, ":unsold_queue"), rpush_uq)
            pipe.publish(
                cls._key(auction_id, ":event"),
                json.dumps({"type": event_type.value, "payload": payload}),
            )
            await pipe.execute()

    @classmethod
    async def emit_recycle_and_next(
        cls, auction_id: int, uq_members: list[int]
    ) -> None:
        member_id = uq_members[0]
        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.delete(cls._key(auction_id, ":unsold_queue"))
            pipe.rpush(cls._key(auction_id, ":auction_queue"), *uq_members)
            pipe.lpop(cls._key(auction_id, ":auction_queue"))
            pipe.hset(
                cls._key(auction_id),
                mapping={
                    "player_id": str(member_id),
                    "bid_amount": "",
                    "bid_leader_id": "",
                },
            )
            pipe.publish(
                cls._key(auction_id, ":event"),
                json.dumps(
                    {"type": AuctionMessageType.NEXT_MEMBER.value, "payload": {}}
                ),
            )
            await pipe.execute()
