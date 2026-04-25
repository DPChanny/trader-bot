from __future__ import annotations

import asyncio
import json
from typing import Any, ClassVar

from fastapi import WebSocket

from shared.dtos.auction import AuctionMessageType, Status
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction
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

        is_new = auction.connect(ws, member_id)
        if not is_new or member_id is None or auction.status != Status.WAITING:
            return
        if not auction.is_leader(member_id):
            return

        await AuctionRepository.emit(
            auction_id,
            AuctionMessageType.MEMBER_CONNECTED,
            {"member_id": member_id},
            sadd_connected=member_id,
        )

        connected = await AuctionRepository.get_connected_member_ids(auction_id)
        if not auction.all_leaders_connected(connected):
            return

        if not await AuctionRepository.acquire_state_lock(auction_id):
            return

        await AuctionRepository.emit(
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
        auction.disconnect(ws)

    @classmethod
    async def on_bid(cls, auction_id: int, leader_id: int, amount: int) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        auction.validate_bid(leader_id, amount)

        await AuctionRepository.emit(
            auction_id,
            AuctionMessageType.BID_PLACED,
            {"leader_id": leader_id, "amount": amount},
            hset={"bid_amount": str(amount), "bid_leader_id": str(leader_id)},
        )

    @classmethod
    async def on_timer_expire(cls, auction_id: int) -> None:
        if not await AuctionRepository.acquire_timer_lock(auction_id):
            return

        auction = cls._auctions.get(auction_id)
        if not auction or auction.status != Status.RUNNING or auction.player_id is None:
            return

        sold_team = auction.resolve_sold()
        if sold_team is not None:
            await AuctionRepository.emit(
                auction_id,
                AuctionMessageType.MEMBER_SOLD,
                {},
                hset={"player_id": "", "bid_amount": "", "bid_leader_id": ""},
                hset_teams={sold_team.team_id: sold_team.model_dump_json()},
            )
        else:
            await AuctionRepository.emit(
                auction_id,
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

        aq_len, uq_len = await AuctionRepository.queue_lengths(auction_id)

        if aq_len == 0:
            if uq_len == 0:
                await AuctionRepository.emit(
                    auction_id,
                    AuctionMessageType.STATUS,
                    {"status": Status.COMPLETED.value},
                    hset={"status": str(Status.COMPLETED.value)},
                )
                return

            _, uq_members = await AuctionRepository.get_all_queue_members(auction_id)
            await AuctionRepository.emit_recycle_and_next(auction_id, uq_members)
        else:
            member_id = await AuctionRepository.get_next_in_queue(auction_id)
            await AuctionRepository.emit(
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

    @classmethod
    async def create_auction(
        cls, preset_snapshot: PresetDetailDTO, is_public: bool
    ) -> Auction:
        auction = Auction.create(preset_snapshot, is_public, cls._make_on_expire)
        cls._auctions[auction.auction_id] = auction

        await AuctionRepository.save(auction)
        await AuctionRepository.subscribe(auction.auction_id, cls._pubsub)
        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._auctions:
            return cls._auctions[auction_id]

        auction = await AuctionRepository.load(
            auction_id, cls._make_on_expire(auction_id)
        )
        if not auction:
            cls._auctions.pop(auction_id, None)
            return None

        if auction.status == Status.RUNNING and auction.player_id is not None:
            auction.start_timer()

        cls._auctions[auction_id] = auction
        await AuctionRepository.subscribe(auction_id, cls._pubsub)
        return auction

    @classmethod
    def _make_on_expire(cls, auction_id: int) -> Any:
        async def on_expire() -> None:
            await cls.on_timer_expire(auction_id)

        return on_expire
