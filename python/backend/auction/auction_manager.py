import asyncio
import random
import time
import uuid
from typing import Any, ClassVar

from fastapi import WebSocket
from loguru import logger
from pydantic import ValidationError

from shared.dtos.auction import (
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    ErrorPayloadDTO,
    InitPayloadDTO,
    Status,
    StatusPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode, WSError
from shared.utils.redis import get_pubsub_redis

from .auction import Auction, Bid, Team
from .auction_repository import _AUCTION_LIFETIME, AuctionRepository


class AuctionManager:
    _sessions: ClassVar[dict[int, Auction]] = {}
    _pubsub: ClassVar[Any] = None
    _listener_task: ClassVar[asyncio.Task | None] = None
    _start_auction_tasks: ClassVar[dict[int, asyncio.Task]] = {}
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
        for task in cls._start_auction_tasks.values():
            task.cancel()
        cls._start_auction_tasks.clear()
        for task in cls._expiry_tasks.values():
            task.cancel()
        cls._expiry_tasks.clear()
        for session in cls._sessions.values():
            session.stop_timer()
        cls._sessions.clear()
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

        session = cls._sessions.pop(auction_id, None)
        if session is None:
            return

        start_task = cls._start_auction_tasks.pop(auction_id, None)
        if start_task:
            start_task.cancel()
        session.stop_timer()
        await session.broadcast(
            AuctionEventType.ERROR, ErrorPayloadDTO(code=AuctionErrorCode.Expired)
        )
        await AuctionRepository(auction_id).unsubscribe(cls._pubsub)
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
                        session = cls._sessions.get(auction_id)
                        if session:
                            match envelope.type:
                                case (
                                    AuctionEventType.NEXT_PLAYER
                                    | AuctionEventType.BID_PLACED
                                ):
                                    session.start_timer()
                                case AuctionEventType.STATUS:
                                    status_payload = StatusPayloadDTO.model_validate(
                                        envelope.payload
                                    )
                                    if status_payload.status == Status.COMPLETED:
                                        session.stop_timer()
                                        cls._sessions.pop(auction_id, None)
                                        await AuctionRepository(auction_id).unsubscribe(
                                            cls._pubsub
                                        )
                            await session.broadcast(envelope.type, envelope.payload)
                    except ValueError, IndexError, KeyError, ValidationError:
                        continue
            except asyncio.CancelledError:
                return
            except Exception:
                pass

            await asyncio.sleep(1)

    @classmethod
    async def on_connect(
        cls, session: Auction, ws: WebSocket, member_id: int | None
    ) -> None:
        repo = AuctionRepository(session.auction_id)
        auction_detail_dto = await repo.get_detail()
        init_payload_dto = InitPayloadDTO(
            auction=auction_detail_dto, member_id=member_id
        )
        await ws.send_json(
            AuctionEventEnvelopeDTO(
                type=AuctionEventType.INIT, payload=init_payload_dto
            ).model_dump(mode="json")
        )

        if auction_detail_dto.status == Status.COMPLETED:
            return

        is_new_leader = session.connect(ws, member_id)

        if is_new_leader:
            new_count = await repo.publish_leader_connected()
            if (
                auction_detail_dto.status == Status.WAITING
                and new_count == session.leader_count
                and await repo.acquire_state_lock()
            ):
                await repo.publish_status(Status.PENDING)
                await repo.release_state_lock()
                cls._start_auction_tasks[session.auction_id] = asyncio.create_task(
                    cls._start_auction(session.auction_id)
                )

    @classmethod
    async def on_disconnect(cls, session: Auction, ws: WebSocket) -> None:
        is_last_leader = session.disconnect(ws)
        if is_last_leader:
            await AuctionRepository(session.auction_id).publish_leader_disconnected()

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
        session = cls._sessions.get(auction_id)
        if not session:
            return

        if not session.is_leader(bid.leader_id):
            raise WSError(AuctionErrorCode.BidNotLeader)

        error_code = await AuctionRepository(auction_id).validate_and_place_bid(
            bid, session.preset_snapshot.team_size
        )
        if error_code != 0:
            raise WSError(error_code)

    @classmethod
    async def on_timer_expire(cls, auction_id: int) -> None:
        repo = AuctionRepository(auction_id)
        if not await repo.acquire_timer_lock():
            return

        try:
            status, player_id, bid = await repo.get_player_state()
            if status != Status.RUNNING or player_id is None:
                return

            if bid is None:
                await repo.publish_member_unsold(player_id)
            else:
                team = await repo.get_team_by_leader(bid.leader_id)
                if team is None:
                    await repo.publish_member_unsold(player_id)
                else:
                    result_team = Team(
                        team_id=team.team_id,
                        leader_id=team.leader_id,
                        member_ids=team.member_ids + [player_id],
                        points=team.points - bid.amount,
                    )
                    await repo.publish_member_sold(result_team)

            await cls._next_player(auction_id)
        finally:
            await repo.release_timer_lock()

    @classmethod
    async def _next_player(cls, auction_id: int) -> None:
        completed = not await AuctionRepository(auction_id).publish_next_player()
        if completed:
            await AuctionRepository(auction_id).publish_status(Status.COMPLETED)

    @classmethod
    async def create_auction(cls, preset_snapshot: PresetDetailDTO) -> Auction:
        auction_id = uuid.uuid4().int
        leader_ids = [
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
        ]
        initial_teams = [
            Team(
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

        session = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            on_timer_expire=cls._get_on_timer_expire(auction_id),
            on_timer_start=cls._get_on_timer_start(auction_id),
        )
        cls._sessions[auction_id] = session

        repo = AuctionRepository(auction_id)
        await repo.save(session, initial_teams, non_leader_ids)
        await repo.subscribe(cls._pubsub)
        cls._schedule_expiry(auction_id, _AUCTION_LIFETIME)
        return session

    @classmethod
    async def get_auction(cls, auction_id: int) -> Auction | None:
        if auction_id in cls._sessions:
            return cls._sessions[auction_id]

        repo = AuctionRepository(auction_id)
        state = await repo.get_state()
        if not state:
            return None

        status = Status(int(state["status"]))
        preset_snapshot = PresetDetailDTO.model_validate_json(state["preset_snapshot"])

        session = Auction(
            auction_id=auction_id,
            preset_snapshot=preset_snapshot,
            on_timer_expire=cls._get_on_timer_expire(auction_id),
            on_timer_start=cls._get_on_timer_start(auction_id),
        )

        if status == Status.RUNNING:
            timer_started_at = await repo.get_timer_started_at()
            remaining = (
                max(1, preset_snapshot.timer - (int(time.time()) - timer_started_at))
                if timer_started_at is not None
                else preset_snapshot.timer
            )
            session.start_timer(remaining, update_start_time=False)

        if status != Status.COMPLETED:
            cls._sessions[auction_id] = session
            await repo.subscribe(cls._pubsub)
            ttl = await repo.get_ttl()
            cls._schedule_expiry(auction_id, ttl)
        return session

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
