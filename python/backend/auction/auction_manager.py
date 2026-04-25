from __future__ import annotations

import asyncio
import json
from typing import Any, ClassVar

from fastapi import WebSocket

from shared.dtos.auction import AuctionMessageType, Status
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction, Bid, Team
from .auction_repository import AuctionRepository


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

    @classmethod
    async def on_connect(
        cls, auction_id: int, ws: WebSocket, member_id: int | None
    ) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        repo = AuctionRepository(auction_id)
        is_new = auction.connect(ws, member_id)
        if not is_new or member_id is None:
            return

        await repo.emit(
            AuctionMessageType.MEMBER_CONNECTED,
            {"member_id": member_id},
            sadd_connected=member_id,
        )

        if auction.status != Status.WAITING:
            return

        connected = await repo.get_connected_member_ids()
        if not auction.all_leaders_connected(connected):
            return

        if not await repo.acquire_state_lock():
            return

        await repo.emit(
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

        repo = AuctionRepository(auction_id)
        member_id, is_last = auction.disconnect(ws)
        if not is_last or member_id is None:
            return

        await repo.emit(
            AuctionMessageType.MEMBER_DISCONNECTED,
            {"member_id": member_id},
            srem_connected=member_id,
        )

        if auction.status != Status.RUNNING:
            return

        connected = await repo.get_connected_member_ids()
        if auction.all_leaders_connected(connected):
            return

        await repo.emit(
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

        await AuctionRepository(auction_id).emit(
            AuctionMessageType.BID_PLACED,
            {"leader_id": leader_id, "amount": amount},
            hset={"bid_amount": str(amount), "bid_leader_id": str(leader_id)},
        )

    @classmethod
    async def on_timer_expire(cls, auction_id: int) -> None:
        repo = AuctionRepository(auction_id)
        if not await repo.acquire_timer_lock():
            return

        auction = cls._auctions.get(auction_id)
        if not auction or auction.status != Status.RUNNING or auction.player_id is None:
            return

        sold_team = auction.resolve_sold()
        if sold_team is not None:
            await repo.emit(
                AuctionMessageType.MEMBER_SOLD,
                {},
                hset={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
                hset_teams={sold_team.team_id: sold_team.model_dump_json()},
            )
        else:
            await repo.emit(
                AuctionMessageType.MEMBER_UNSOLD,
                {},
                hset={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
                rpush_uq=auction.player_id,
            )

        await cls._do_next_player(auction_id)

    @classmethod
    async def _do_next_player(cls, auction_id: int) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        repo = AuctionRepository(auction_id)
        aq_len, uq_len = await repo.queue_lengths()

        forced_team = auction.forced_fill_team(aq_len + uq_len)
        if forced_team is not None:
            aq_members, uq_members = await repo.get_all_queue_members()
            updated_team = Team(
                team_id=forced_team.team_id,
                leader_id=forced_team.leader_id,
                member_ids=forced_team.member_ids + aq_members + uq_members,
                points=forced_team.points,
            )
            await repo.emit_forced_fill(
                forced_team.team_id, updated_team.model_dump_json()
            )
            await repo.emit(
                AuctionMessageType.STATUS,
                {"status": Status.COMPLETED.value},
                hset={"status": str(Status.COMPLETED.value)},
            )
            return

        if aq_len == 0:
            if uq_len == 0:
                await repo.emit(
                    AuctionMessageType.STATUS,
                    {"status": Status.COMPLETED.value},
                    hset={"status": str(Status.COMPLETED.value)},
                )
                return

            _, uq_members = await repo.get_all_queue_members()
            await repo.emit_recycle_and_next(uq_members)
        else:
            member_id = await repo.get_next_in_queue()
            await repo.emit(
                AuctionMessageType.NEXT_MEMBER,
                {"member_id": member_id},
                hset={
                    "player_id": str(member_id),
                    "bid_amount": "",
                    "bid_leader_id": "",
                },
                lpop_aq=True,
            )

    @classmethod
    async def create_auction(
        cls, preset_snapshot: PresetDetailDTO, is_public: bool
    ) -> Auction:
        auction = Auction.create(preset_snapshot, is_public, cls._make_on_expire)
        cls._auctions[auction.auction_id] = auction

        repo = AuctionRepository(auction.auction_id)
        await repo.save(
            state_mapping={
                "status": str(Status.WAITING.value),
                "player_id": "",
                "bid_amount": "",
                "bid_leader_id": "",
                "preset_id": str(preset_snapshot.preset_id),
                "guild_id": str(preset_snapshot.guild_id),
                "is_public": str(is_public),
                "preset_snapshot": preset_snapshot.model_dump_json(),
            },
            teams=auction.teams,
            auction_queue=auction.auction_queue,
        )
        await repo.subscribe(cls._pubsub)
        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._auctions:
            return cls._auctions[auction_id]

        repo = AuctionRepository(auction_id)
        raw = await repo.load()
        if not raw:
            cls._auctions.pop(auction_id, None)
            return None

        data = raw["state"]
        preset_snapshot = PresetDetailDTO.model_validate_json(data["preset_snapshot"])
        teams = [Team.model_validate_json(v) for v in raw["teams"].values()]
        bid = (
            Bid(amount=int(data["bid_amount"]), leader_id=int(data["bid_leader_id"]))
            if data.get("bid_amount")
            else None
        )

        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            is_public=data["is_public"] == "True",
            teams=teams,
            auction_queue=[int(x) for x in raw["auction_queue"]],
            unsold_queue=[int(x) for x in raw["unsold_queue"]],
            status=Status(int(data["status"])),
            player_id=int(data["player_id"]) if data.get("player_id") else None,
            bid=bid,
            on_expire=cls._make_on_expire(auction_id),
        )
        if auction.status == Status.RUNNING and auction.player_id is not None:
            auction.start_timer()

        cls._auctions[auction_id] = auction
        await repo.subscribe(cls._pubsub)
        return auction

    @classmethod
    def _make_on_expire(cls, auction_id: int) -> Any:
        async def on_expire() -> None:
            await cls.on_timer_expire(auction_id)

        return on_expire
