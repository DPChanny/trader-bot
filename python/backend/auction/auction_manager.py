import asyncio
import random
import time
import uuid
from typing import Any, ClassVar

from loguru import logger
from pydantic import ValidationError

from shared.dtos.auction import (
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    ErrorPayloadDTO,
    Status,
    TeamDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode
from shared.utils.redis import get_pubsub_redis

from .auction import Auction
from .auction_repository import _AUCTION_LIFETIME, AuctionRepository


class AuctionManager:
    _auctions: ClassVar[dict[int, Auction]] = {}
    _pubsub: ClassVar[Any] = None
    _listener_task: ClassVar[asyncio.Task | None] = None
    _expiry_tasks: ClassVar[dict[int, asyncio.Task]] = {}

    _KEEPALIVE_CHANNEL = "auction:__listener__"

    @classmethod
    async def setup(cls) -> None:
        cls._pubsub = get_pubsub_redis().pubsub()
        await cls._pubsub.subscribe(cls._KEEPALIVE_CHANNEL)
        cls._listener_task = asyncio.create_task(cls._listener())

    @classmethod
    async def cleanup(cls) -> None:
        if cls._listener_task:
            cls._listener_task.cancel()
            with asyncio.suppress(asyncio.CancelledError):
                await cls._listener_task
        for task in cls._expiry_tasks.values():
            task.cancel()
        cls._expiry_tasks.clear()
        for auction in cls._auctions.values():
            auction.stop()
        cls._auctions.clear()
        if cls._pubsub:
            await cls._pubsub.close()

    @classmethod
    def _schedule_expiry(cls, auction_id: int, ttl: int) -> None:
        task = asyncio.create_task(cls._expire_auction(auction_id, ttl))
        cls._expiry_tasks[auction_id] = task

    @classmethod
    async def _expire_auction(cls, auction_id: int, ttl: int) -> None:
        try:
            await asyncio.sleep(ttl)
        except asyncio.CancelledError:
            return
        finally:
            cls._expiry_tasks.pop(auction_id, None)

        auction = cls._auctions.pop(auction_id, None)
        if auction is None:
            return

        auction.stop()
        await auction.broadcast(
            AuctionEventType.ERROR, ErrorPayloadDTO(code=AuctionErrorCode.Expired)
        )
        await auction.repo.unsubscribe(cls._pubsub)
        logger.warning(f"Auction {auction_id} expired and was cleaned up")

    @classmethod
    async def _listener(cls) -> None:
        while True:
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
                            is_completed = await auction.on_event(envelope)
                            if is_completed:
                                cls._auctions.pop(auction_id, None)
                                await auction.repo.unsubscribe(cls._pubsub)
                    except ValueError, IndexError, KeyError, ValidationError:
                        continue
            except asyncio.CancelledError:
                return
            except Exception as e:
                logger.error(f"Listener error: {type(e).__name__}: {e}")

            await asyncio.sleep(1)

    @classmethod
    async def create_auction(cls, preset_snapshot: PresetDetailDTO) -> Auction:
        auction_id = uuid.uuid4().int
        leader_ids = [
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
        ]
        initial_teams = [
            TeamDTO(
                team_id=i,
                leader_id=leader_id,
                member_ids=[leader_id],
                points=preset_snapshot.points,
            )
            for i, leader_id in enumerate(leader_ids)
        ]
        non_leader_ids = [
            pm.member_id for pm in preset_snapshot.preset_members if not pm.is_leader
        ]
        random.shuffle(non_leader_ids)

        auction = Auction(auction_id=auction_id, preset_snapshot=preset_snapshot)
        cls._auctions[auction_id] = auction

        await auction.repo.save(auction, initial_teams, non_leader_ids)
        await auction.repo.subscribe(cls._pubsub)
        cls._schedule_expiry(auction_id, _AUCTION_LIFETIME)
        return auction

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._auctions:
            return cls._auctions[auction_id]

        repo = AuctionRepository(auction_id)
        detail = await repo.get_detail()
        if not detail or not detail.preset_snapshot:
            return None

        auction = Auction(auction_id=auction_id, preset_snapshot=detail.preset_snapshot)

        if detail.status == Status.RUNNING:
            timer_started_at = await repo.get_timer_started_at()
            remaining = (
                max(
                    1,
                    detail.preset_snapshot.timer
                    - (int(time.time()) - timer_started_at),
                )
                if timer_started_at is not None
                else detail.preset_snapshot.timer
            )
            auction.start_timer(remaining, update_start_time=False)

        if detail.status != Status.COMPLETED:
            cls._auctions[auction_id] = auction
            await auction.repo.subscribe(cls._pubsub)
            ttl = await repo.get_ttl()
            cls._schedule_expiry(auction_id, ttl)
        return auction
