import asyncio
import time
import uuid
from typing import Any, ClassVar

from fastapi import WebSocket
from pydantic import ValidationError

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    BidDTO,
    InitPayloadDTO,
    Status,
    StatusPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.redis import get_redis

from .auction import Auction, Bid
from .auction_repository import AuctionRepository


class AuctionManager:
    _auctions: ClassVar[dict[int, Auction]] = {}
    _pubsub: ClassVar[Any] = None
    _listener_task: ClassVar[asyncio.Task | None] = None
    _start_auction_tasks: ClassVar[dict[int, asyncio.Task]] = {}

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
        for task in cls._start_auction_tasks.values():
            task.cancel()
        cls._start_auction_tasks.clear()
        for auction in cls._auctions.values():
            auction.stop_timer()
        cls._auctions.clear()
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
                    envelope = AuctionEventEnvelopeDTO.model_validate_json(
                        message["data"]
                    )
                    auction = cls._auctions.get(auction_id)
                    if auction:
                        match envelope.type:
                            case AuctionEventType.NEXT_PLAYER:
                                auction.on_next_player()
                            case AuctionEventType.BID_PLACED:
                                bid = BidDTO.model_validate(envelope.payload)
                                auction.on_bid_placed(
                                    Bid(leader_id=bid.leader_id, amount=bid.amount)
                                )
                            case AuctionEventType.MEMBER_SOLD:
                                auction.on_member_sold()
                            case AuctionEventType.MEMBER_UNSOLD:
                                auction.on_member_unsold()
                            case AuctionEventType.STATUS:
                                status_payload = StatusPayloadDTO.model_validate(
                                    envelope.payload
                                )
                                auction.on_status(status_payload.status)
                                if auction.status == Status.COMPLETED:
                                    cls._auctions.pop(auction_id, None)
                                    await AuctionRepository(auction_id).unsubscribe(
                                        cls._pubsub
                                    )
                        await auction.broadcast(envelope.type, envelope.payload)
                except ValueError, IndexError, KeyError, ValidationError:
                    continue
        except asyncio.CancelledError:
            pass

    @classmethod
    async def on_connect(
        cls, auction_id: int, ws: WebSocket, member_id: int | None
    ) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        auction_detail_dto = AuctionDetailDTO.model_validate(auction)
        init_payload_dto = InitPayloadDTO(
            auction=auction_detail_dto, member_id=member_id
        )
        await ws.send_json(
            AuctionEventEnvelopeDTO(
                type=AuctionEventType.INIT, payload=init_payload_dto
            ).model_dump(mode="json")
        )

        is_new_leader = auction.connect(ws, member_id)

        if is_new_leader:
            repo = AuctionRepository(auction_id)
            await repo.publish_leader_connected()
            if (
                auction.status == Status.WAITING
                and auction.connected_leader_count == auction.leader_count
                and await repo.acquire_state_lock()
            ):
                await repo.publish_status(Status.PENDING)
                await repo.release_state_lock()
                cls._start_auction_tasks[auction_id] = asyncio.create_task(
                    cls._start_auction(auction_id)
                )

    @classmethod
    async def on_disconnect(cls, auction_id: int, ws: WebSocket) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return
        is_last_leader = auction.disconnect(ws)
        if is_last_leader:
            await AuctionRepository(auction_id).publish_leader_disconnected()

    @classmethod
    async def _start_auction(cls, auction_id: int) -> None:
        try:
            await asyncio.sleep(5)
        except asyncio.CancelledError:
            return
        finally:
            cls._start_auction_tasks.pop(auction_id, None)

        await AuctionRepository(auction_id).publish_status(Status.RUNNING)
        await cls._next_player(auction_id)

    @classmethod
    async def on_place_bid(cls, auction_id: int, bid: Bid) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        auction.validate_bid(bid)

        await AuctionRepository(auction_id).publish_bid_placed(bid)

    @classmethod
    async def on_timer_expire(cls, auction_id: int) -> None:
        repo = AuctionRepository(auction_id)
        if not await repo.acquire_timer_lock():
            return

        auction = cls._auctions.get(auction_id)
        if not auction or auction.status != Status.RUNNING or auction.player_id is None:
            await repo.release_timer_lock()
            return

        result_team = auction.settle()
        if result_team is None:
            await repo.publish_member_unsold(auction.player_id)
        else:
            await repo.publish_member_sold(result_team)

        await cls._next_player(auction_id)
        await repo.release_timer_lock()

    @classmethod
    async def _next_player(cls, auction_id: int) -> None:
        auction = cls._auctions.get(auction_id)
        if not auction:
            return

        completed = not await AuctionRepository(auction_id).publish_next_player()
        if completed:
            await AuctionRepository(auction_id).publish_status(Status.COMPLETED)

    @classmethod
    async def create_auction(cls, preset_snapshot: PresetDetailDTO) -> Auction:
        auction_id = uuid.uuid4().int
        auction = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            on_timer_expire=cls._get_on_timer_expire(auction_id),
            on_timer_start=cls._get_on_timer_start(auction_id),
        )
        cls._auctions[auction.auction_id] = auction

        repo = AuctionRepository(auction_id)
        await repo.save(auction)
        await repo.subscribe(cls._pubsub)
        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._auctions:
            return cls._auctions[auction_id]

        repo = AuctionRepository(auction_id)
        auction = await repo.load(
            cls._get_on_timer_expire(auction_id), cls._get_on_timer_start(auction_id)
        )
        if not auction:
            cls._auctions.pop(auction_id, None)
            return None

        if auction.status == Status.RUNNING:
            timer_started_at = await repo.get_timer_started_at()
            remaining = (
                max(
                    1,
                    auction.preset_snapshot.timer
                    - (int(time.time()) - timer_started_at),
                )
                if timer_started_at is not None
                else auction.preset_snapshot.timer
            )
            auction.start_timer(remaining)

        cls._auctions[auction_id] = auction
        await repo.subscribe(cls._pubsub)
        return auction

    @classmethod
    def _get_on_timer_expire(cls, auction_id: int) -> Any:
        async def _on_timer_expire() -> None:
            await cls.on_timer_expire(auction_id)

        return _on_timer_expire

    @classmethod
    def _get_on_timer_start(cls, auction_id: int) -> Any:
        async def _on_timer_start() -> None:
            await AuctionRepository(auction_id).set_timer_started_at()

        return _on_timer_start
