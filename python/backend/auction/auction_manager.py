from __future__ import annotations

import asyncio
import json
import random
import uuid
from typing import Any, ClassVar

from fastapi import WebSocket

from shared.dtos.auction import AuctionMessageType, Status
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction, Bid, Team


def _key(auction_id: int, suffix: str = "") -> str:
    return f"auction:{auction_id}{suffix}"


class AuctionManager:
    _auctions: ClassVar[dict[int, Auction]] = {}
    _pubsub: ClassVar[Any] = None
    _listener_task: ClassVar[asyncio.Task | None] = None

    @classmethod
    async def setup(cls) -> None:
        r = get_redis()
        cls._pubsub = r.pubsub()
        cls._listener_task = asyncio.create_task(cls._listen())

    @classmethod
    async def cleanup(cls) -> None:
        if cls._listener_task:
            cls._listener_task.cancel()
            with asyncio.suppress(asyncio.CancelledError):
                await cls._listener_task
        if cls._pubsub:
            await cls._pubsub.close()

    # ------------------------------------------------------------------ #
    #  Pub-sub listener                                                    #
    # ------------------------------------------------------------------ #

    @classmethod
    async def _listen(cls) -> None:
        try:
            async for message in cls._pubsub.listen():
                if message["type"] != "message":
                    continue
                try:
                    parts = message["channel"].split(":")
                    auction_id = int(parts[1])
                    data = json.loads(message["data"])
                    await cls._on_pubsub(auction_id, data)
                except ValueError, IndexError, KeyError:
                    continue
        except asyncio.CancelledError:
            pass

    @classmethod
    async def _on_pubsub(cls, auction_id: int, data: dict) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return
        event_type = AuctionMessageType(data["type"])
        payload = data["payload"]
        auction.apply(event_type, payload)
        await auction.broadcast(event_type, payload)

    # ------------------------------------------------------------------ #
    #  Emit helper                                                         #
    # ------------------------------------------------------------------ #

    @classmethod
    async def _emit(
        cls,
        auction_id: int,
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
                pipe.hset(_key(auction_id), mapping=hset)
            if hset_teams:
                for team_id, val in hset_teams.items():
                    pipe.hset(_key(auction_id, ":teams"), str(team_id), val)
            if lpop_aq:
                pipe.lpop(_key(auction_id, ":auction_queue"))
            if rpush_uq is not None:
                pipe.rpush(_key(auction_id, ":unsold_queue"), rpush_uq)
            if del_uq:
                pipe.delete(_key(auction_id, ":unsold_queue"))
            if rpush_aq:
                pipe.rpush(_key(auction_id, ":auction_queue"), *rpush_aq)
            if sadd_connected is not None:
                pipe.sadd(_key(auction_id, ":connected_member_ids"), sadd_connected)
            if srem_connected is not None:
                pipe.srem(_key(auction_id, ":connected_member_ids"), srem_connected)
            if del_state_lock:
                pipe.delete(_key(auction_id, ":state_lock"))
            pipe.publish(
                _key(auction_id, ":event"),
                json.dumps({"type": event_type.value, "payload": payload}),
            )
            await pipe.execute()

    # ------------------------------------------------------------------ #
    #  Public entry points                                                 #
    # ------------------------------------------------------------------ #

    @classmethod
    async def on_connect(
        cls, auction_id: int, ws: WebSocket, member_id: int | None
    ) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        is_new = auction.connect(ws, member_id)
        if not is_new or member_id is None:
            return

        await cls._emit(
            auction_id,
            AuctionMessageType.MEMBER_CONNECTED,
            {"member_id": member_id},
            sadd_connected=member_id,
        )

        if auction.status != Status.WAITING:
            return

        r = get_redis()
        connected = await r.smembers(_key(auction_id, ":connected_member_ids"))
        connected_ids = {int(x) for x in connected}
        if not auction._leader_member_ids.issubset(connected_ids):
            return

        # All leaders connected — try to acquire state_lock
        acquired = await r.set(_key(auction_id, ":state_lock"), "1", nx=True, ex=3600)
        if not acquired:
            return

        await cls._emit(
            auction_id,
            AuctionMessageType.STATUS,
            {"status": Status.RUNNING.value},
            hset={"status": str(Status.RUNNING.value)},
        )
        if auction.player_id is None:
            await cls._do_next_player(auction_id)

    @classmethod
    async def on_disconnect(cls, auction_id: int, ws: WebSocket) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        member_id, is_last = auction.disconnect(ws)
        if not is_last or member_id is None:
            return

        await cls._emit(
            auction_id,
            AuctionMessageType.MEMBER_DISCONNECTED,
            {"member_id": member_id},
            srem_connected=member_id,
        )

        if auction.status != Status.RUNNING:
            return

        r = get_redis()
        connected = await r.smembers(_key(auction_id, ":connected_member_ids"))
        connected_ids = {int(x) for x in connected}
        if auction._leader_member_ids.issubset(connected_ids):
            return

        await cls._emit(
            auction_id,
            AuctionMessageType.STATUS,
            {"status": Status.WAITING.value},
            hset={"status": str(Status.WAITING.value)},
            del_state_lock=True,
        )

    @classmethod
    async def on_bid(cls, auction_id: int, leader_id: int, amount: int) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        auction.validate_bid(leader_id, amount)

        await cls._emit(
            auction_id,
            AuctionMessageType.BID_PLACED,
            {"leader_id": leader_id, "amount": amount},
            hset={"bid_amount": str(amount), "bid_leader_id": str(leader_id)},
        )

    @classmethod
    async def on_timer_expire(cls, auction_id: int) -> None:
        r = get_redis()
        acquired = await r.set(_key(auction_id, ":timer_lock"), "1", nx=True, ex=10)
        if not acquired:
            return

        auction = cls._auctions.get(auction_id)
        if not auction or auction.status != Status.RUNNING or auction.player_id is None:
            return

        if auction.bid is not None:
            # Normal sell
            team = auction._member_id_to_team.get(auction.bid.leader_id)
            if team:
                updated_team = Team(
                    team_id=team.team_id,
                    leader_id=team.leader_id,
                    member_ids=team.member_ids + [auction.player_id],
                    points=team.points - auction.bid.amount,
                )
                await cls._emit(
                    auction_id,
                    AuctionMessageType.MEMBER_SOLD,
                    {},
                    hset={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
                    hset_teams={team.team_id: updated_team.model_dump_json()},
                )
        else:
            # Unsold
            await cls._emit(
                auction_id,
                AuctionMessageType.MEMBER_UNSOLD,
                {},
                hset={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
                rpush_uq=auction.player_id,
            )

        await cls._do_next_player(auction_id)

    # ------------------------------------------------------------------ #
    #  Internal logic                                                      #
    # ------------------------------------------------------------------ #

    @classmethod
    async def _do_next_player(cls, auction_id: int) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        r = get_redis()
        aq_len = await r.llen(_key(auction_id, ":auction_queue"))
        uq_len = await r.llen(_key(auction_id, ":unsold_queue"))

        incomplete_teams = [
            t for t in auction.teams if len(t.member_ids) < auction.team_size
        ]

        # Forced fill: one incomplete team left, remaining members exactly fill it
        if len(incomplete_teams) == 1:
            team = incomplete_teams[0]
            remaining_slots = auction.team_size - len(team.member_ids)
            if aq_len + uq_len == remaining_slots:
                aq_members = [
                    int(x)
                    for x in await r.lrange(_key(auction_id, ":auction_queue"), 0, -1)
                ]
                uq_members = [
                    int(x)
                    for x in await r.lrange(_key(auction_id, ":unsold_queue"), 0, -1)
                ]
                all_members = aq_members + uq_members
                updated_team = Team(
                    team_id=team.team_id,
                    leader_id=team.leader_id,
                    member_ids=team.member_ids + all_members,
                    points=team.points,
                )
                async with r.pipeline(transaction=True) as pipe:
                    pipe.hset(
                        _key(auction_id),
                        mapping={
                            "player_id": "",
                            "bid_amount": "",
                            "bid_leader_id": "",
                        },
                    )
                    pipe.hset(
                        _key(auction_id, ":teams"),
                        str(team.team_id),
                        updated_team.model_dump_json(),
                    )
                    pipe.delete(_key(auction_id, ":auction_queue"))
                    pipe.delete(_key(auction_id, ":unsold_queue"))
                    pipe.publish(
                        _key(auction_id, ":event"),
                        json.dumps(
                            {
                                "type": AuctionMessageType.MEMBER_SOLD.value,
                                "payload": {},
                            }
                        ),
                    )
                    await pipe.execute()

                await cls._emit(
                    auction_id,
                    AuctionMessageType.STATUS,
                    {"status": Status.COMPLETED.value},
                    hset={"status": str(Status.COMPLETED.value)},
                )
                return

        # Normal next player
        if aq_len == 0:
            if uq_len == 0:
                await cls._emit(
                    auction_id,
                    AuctionMessageType.STATUS,
                    {"status": Status.COMPLETED.value},
                    hset={"status": str(Status.COMPLETED.value)},
                )
                return

            # Recycle: move unsold_queue → auction_queue
            uq_members = [
                int(x) for x in await r.lrange(_key(auction_id, ":unsold_queue"), 0, -1)
            ]
            member_id = uq_members[0]
            async with r.pipeline(transaction=True) as pipe:
                pipe.delete(_key(auction_id, ":unsold_queue"))
                pipe.rpush(_key(auction_id, ":auction_queue"), *uq_members)
                pipe.lpop(_key(auction_id, ":auction_queue"))
                pipe.hset(
                    _key(auction_id),
                    mapping={
                        "player_id": str(member_id),
                        "bid_amount": "",
                        "bid_leader_id": "",
                    },
                )
                pipe.publish(
                    _key(auction_id, ":event"),
                    json.dumps(
                        {
                            "type": AuctionMessageType.NEXT_MEMBER.value,
                            "payload": {"member_id": member_id},
                        }
                    ),
                )
                await pipe.execute()
        else:
            member_id = int(await r.lindex(_key(auction_id, ":auction_queue"), 0))
            await cls._emit(
                auction_id,
                AuctionMessageType.NEXT_MEMBER,
                {"member_id": member_id},
                hset={
                    "player_id": str(member_id),
                    "bid_amount": "",
                    "bid_leader_id": "",
                },
                lpop_aq=True,
            )

    # ------------------------------------------------------------------ #
    #  Create / Get                                                        #
    # ------------------------------------------------------------------ #

    @classmethod
    async def create_auction(
        cls, preset_snapshot: PresetDetailDTO, is_public: bool
    ) -> Auction:
        auction_id = uuid.uuid4().int

        leaders = [pm for pm in preset_snapshot.preset_members if pm.is_leader]
        teams = [
            Team(
                team_id=i,
                leader_id=leader.member_id,
                member_ids=[leader.member_id],
                points=preset_snapshot.points,
            )
            for i, leader in enumerate(leaders)
        ]
        non_leaders = [
            pm.member_id for pm in preset_snapshot.preset_members if not pm.is_leader
        ]
        random.shuffle(non_leaders)

        on_expire = cls._make_on_expire(auction_id)
        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            is_public=is_public,
            teams=teams,
            auction_queue=non_leaders,
            unsold_queue=[],
            status=Status.WAITING,
            player_id=None,
            bid=None,
            on_expire=on_expire,
        )
        cls._auctions[auction_id] = auction

        r = get_redis()
        async with r.pipeline(transaction=True) as pipe:
            pipe.hset(
                _key(auction_id),
                mapping={
                    "status": str(Status.WAITING.value),
                    "player_id": "",
                    "bid_amount": "",
                    "bid_leader_id": "",
                    "preset_id": str(preset_snapshot.preset_id),
                    "guild_id": str(preset_snapshot.guild_id),
                    "is_public": str(is_public),
                    "preset_snapshot": preset_snapshot.model_dump_json(),
                },
            )
            pipe.expire(_key(auction_id), 3600)
            for team in teams:
                pipe.hset(
                    _key(auction_id, ":teams"),
                    str(team.team_id),
                    team.model_dump_json(),
                )
            pipe.expire(_key(auction_id, ":teams"), 3600)
            if non_leaders:
                pipe.rpush(_key(auction_id, ":auction_queue"), *non_leaders)
                pipe.expire(_key(auction_id, ":auction_queue"), 3600)
            await pipe.execute()

        await cls._pubsub.subscribe(_key(auction_id, ":event"))
        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._auctions:
            return cls._auctions[auction_id]

        r = get_redis()
        data = await r.hgetall(_key(auction_id))
        if not data:
            cls._auctions.pop(auction_id, None)
            return None

        teams_raw = await r.hgetall(_key(auction_id, ":teams"))
        aq_raw = await r.lrange(_key(auction_id, ":auction_queue"), 0, -1)
        uq_raw = await r.lrange(_key(auction_id, ":unsold_queue"), 0, -1)

        preset_snapshot = PresetDetailDTO.model_validate_json(data["preset_snapshot"])
        teams = [Team.model_validate_json(v) for v in teams_raw.values()]
        bid = (
            Bid(amount=int(data["bid_amount"]), leader_id=int(data["bid_leader_id"]))
            if data.get("bid_amount")
            else None
        )

        on_expire = cls._make_on_expire(auction_id)
        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            is_public=data["is_public"] == "True",
            teams=teams,
            auction_queue=[int(x) for x in aq_raw],
            unsold_queue=[int(x) for x in uq_raw],
            status=Status(int(data["status"])),
            player_id=int(data["player_id"]) if data.get("player_id") else None,
            bid=bid,
            on_expire=on_expire,
        )
        if auction.status == Status.RUNNING and auction.player_id is not None:
            auction.start_timer()

        cls._auctions[auction_id] = auction
        await cls._pubsub.subscribe(_key(auction_id, ":event"))
        return auction

    @classmethod
    def _make_on_expire(cls, auction_id: int):
        async def on_expire() -> None:
            await cls.on_timer_expire(auction_id)

        return on_expire
