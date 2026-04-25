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

from .auction import Auction, Team
from .auction_repository import AuctionRepository


_COUNTDOWN_SECONDS = 5


class AuctionManager:
    _auctions: ClassVar[dict[int, Auction]] = {}
    _pubsub: ClassVar[Any] = None
    _listener_task: ClassVar[asyncio.Task | None] = None
    _countdown_tasks: ClassVar[dict[int, asyncio.Task]] = {}

    @classmethod
    async def setup(cls) -> None:
        r = get_redis()
        cls._pubsub = r.pubsub()
        cls._listener_task = asyncio.create_task(cls._listener())

    @classmethod
    async def cleanup(cls) -> None:
        if cls._listener_task:
            cls._listener_task.cancel()
            with asyncio.suppress(asyncio.CancelledError):
                await cls._listener_task
        for task in cls._countdown_tasks.values():
            task.cancel()
        cls._countdown_tasks.clear()
        if cls._pubsub:
            await cls._pubsub.close()

    @classmethod
    async def _listener(cls) -> None:
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

        is_new = auction.connect(ws, member_id)
        if not is_new or member_id is None or not auction.is_leader(member_id):
            return
        if auction.status != Status.WAITING:
            return

        repo = AuctionRepository(auction_id)
        new_count = await repo.publish_leader_connected()

        if new_count < auction.leader_count:
            return
        if not await repo.acquire_state_lock():
            return

        await repo.publish_status(Status.PENDING)
        await repo.release_state_lock()
        cls._countdown_tasks[auction_id] = asyncio.create_task(
            cls._start_auction(auction_id)
        )

    @classmethod
    async def on_disconnect(cls, auction_id: int, ws: WebSocket) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return
        member_id, is_last = auction.disconnect(ws)
        if (
            is_last
            and member_id is not None
            and auction.is_leader(member_id)
            and auction.status == Status.WAITING
        ):
            await AuctionRepository(auction_id).publish_leader_disconnected()

    @classmethod
    async def _start_auction(cls, auction_id: int) -> None:
        try:
            await asyncio.sleep(_COUNTDOWN_SECONDS)
        except asyncio.CancelledError:
            return
        finally:
            cls._countdown_tasks.pop(auction_id, None)

        await AuctionRepository(auction_id).publish_status(Status.RUNNING)
        await cls._next_player(auction_id)

    @classmethod
    async def on_place_bid(cls, auction_id: int, leader_id: int, amount: int) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        auction.validate_bid(leader_id, amount)

        await AuctionRepository(auction_id).publish_bid_placed(leader_id, amount)

    @classmethod
    async def on_timer_expire(cls, auction_id: int) -> None:
        if not await AuctionRepository(auction_id).acquire_timer_lock():
            return

        auction = cls._auctions.get(auction_id)
        if not auction or auction.status != Status.RUNNING or auction.player_id is None:
            return

        repo = AuctionRepository(auction_id)
        sold_team = auction.resolve_sold()
        if sold_team is not None:
            await repo.publish_member_sold(
                sold_team.team_id, sold_team.model_dump_json()
            )
        else:
            await repo.publish_member_unsold(auction.player_id)

        await cls._next_player(auction_id)
        await repo.release_timer_lock()

    @classmethod
    async def _next_player(cls, auction_id: int) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        completed = await AuctionRepository(auction_id).publish_next_player()
        if completed:
            await AuctionRepository(auction_id).publish_status(Status.COMPLETED)

    @classmethod
    async def create_auction(cls, preset_snapshot: PresetDetailDTO) -> Auction:
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
        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            teams=teams,
            auction_queue=non_leaders,
            unsold_queue=[],
            status=Status.WAITING,
            player_id=None,
            bid=None,
            on_expire=cls._get_on_expire(auction_id),
        )
        cls._auctions[auction.auction_id] = auction

        repo = AuctionRepository(auction_id)
        await repo.save(auction, cls._pubsub)
        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._auctions:
            return cls._auctions[auction_id]

        repo = AuctionRepository(auction_id)
        auction = await repo.load(cls._get_on_expire(auction_id), cls._pubsub)
        if not auction:
            cls._auctions.pop(auction_id, None)
            return None

        if auction.status == Status.RUNNING and auction.player_id is not None:
            auction.start_timer()
        elif auction.status == Status.PENDING:
            cls._countdown_tasks[auction_id] = asyncio.create_task(
                cls._start_auction(auction_id)
            )

        cls._auctions[auction_id] = auction
        return auction

    @classmethod
    def _get_on_expire(cls, auction_id: int) -> Any:
        async def on_expire() -> None:
            await cls.on_timer_expire(auction_id)

        return on_expire
