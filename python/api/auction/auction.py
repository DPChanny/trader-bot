from __future__ import annotations

import asyncio
import contextlib
import random
from dataclasses import dataclass
from enum import IntEnum

from fastapi import WebSocket

from shared.dtos import BaseDTO
from shared.dtos.auction_dto import (
    BidPlacedDTO,
    MemberConnectionDTO,
    MemberSoldDTO,
    MessageType,
    NextMemberDTO,
    StatusDTO,
    TimerDTO,
)
from shared.dtos.preset_dto import PresetDetailDTO
from shared.utils.error import AuctionErrorCode, WebSocketError


class AuctionStatus(IntEnum):
    WAITING = 0
    RUNNING = 1
    COMPLETED = 2


@dataclass
class Team:
    team_id: int
    leader_id: int
    member_ids: list[int]
    points: int


@dataclass
class Bid:
    amount: int
    leader_id: int


class Auction:
    def __init__(
        self,
        auction_id: int,
        preset_snapshot: PresetDetailDTO,
        is_public: bool,
    ):
        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot
        self.is_public = is_public

        self.guild_id = self.preset_snapshot.guild_id
        self.preset_id = self.preset_snapshot.preset_id
        self.team_size = self.preset_snapshot.team_size
        self.status = AuctionStatus.WAITING

        preset_members = self.preset_snapshot.preset_members
        leaders = [pm for pm in preset_members if pm.is_leader]
        self.leader_member_ids = {pm.member_id for pm in leaders}

        self.teams = [
            Team(
                team_id=team_id,
                leader_id=leader.member_id,
                member_ids=[leader.member_id],
                points=self.preset_snapshot.points,
            )
            for team_id, leader in enumerate(leaders)
        ]

        self.member_id_to_team: dict[int, Team] = {}
        for team in self.teams:
            for member_id in team.member_ids:
                self.member_id_to_team[member_id] = team

        auction_members = [
            pm.member_id
            for pm in preset_members
            if pm.member_id not in self.leader_member_ids
        ]
        random.shuffle(auction_members)
        self.auction_queue: list[int] = auction_members
        self.unsold_queue: list[int] = []
        self.current_member_id: int | None = None
        self.current_bid: Bid | None = None
        self.timer = self.preset_snapshot.timer

        self.member_id_to_ws_set: dict[int, set[WebSocket]] = {}
        self.public_websockets: set[WebSocket] = set()

        self.timer_task: asyncio.Task | None = None
        self.auto_delete_task: asyncio.Task | None = None
        self.was_in_progress: bool = False
        self._state_lock = asyncio.Lock()
        self._broadcast_lock = asyncio.Lock()

        self._start_auto_delete_task()

    @property
    def connected_member_ids(self) -> list[int]:
        return list(self.member_id_to_ws_set.keys())

    def _start_auto_delete_task(self):
        self._cancel_auto_delete_task()
        self.auto_delete_task = asyncio.create_task(self._auto_delete())

    def _cancel_auto_delete_task(self):
        if self.auto_delete_task and not self.auto_delete_task.done():
            self.auto_delete_task.cancel()
        self.auto_delete_task = None

    async def _auto_delete(self):
        await asyncio.sleep(300)
        if self.status == AuctionStatus.WAITING:
            await self.terminate_auction()
            from .auction_manager import auction_manager

            auction_manager.remove_auction(self.auction_id)

    async def connect(self, websocket: WebSocket, member_id: int | None) -> None:
        if member_id is not None:
            is_new = member_id not in self.member_id_to_ws_set
            if is_new:
                self.member_id_to_ws_set[member_id] = set()
            self.member_id_to_ws_set[member_id].add(websocket)

            if is_new:
                await self.broadcast(
                    MessageType.MEMBER_CONNECTED,
                    MemberConnectionDTO(member_id=member_id),
                )

                if (
                    member_id in self.leader_member_ids
                    and self.status == AuctionStatus.WAITING
                    and self._can_progress()
                ):
                    await self._set_status(AuctionStatus.RUNNING)
        else:
            self.public_websockets.add(websocket)

    async def _handle_disconnected_members(self, member_ids: list[int]) -> None:
        for member_id in member_ids:
            await self.broadcast(
                MessageType.MEMBER_DISCONNECTED,
                MemberConnectionDTO(member_id=member_id),
            )

        if (
            member_ids
            and self.status == AuctionStatus.RUNNING
            and not self._can_progress()
        ):
            await self._set_status(AuctionStatus.WAITING)

    async def disconnect(self, websocket: WebSocket, member_id: int | None) -> None:
        disconnected_member_ids: list[int] = []
        if member_id is not None:
            member_websockets = self.member_id_to_ws_set.get(member_id)
            if member_websockets is not None:
                member_websockets.discard(websocket)
                if not member_websockets:
                    del self.member_id_to_ws_set[member_id]
                    disconnected_member_ids.append(member_id)
        else:
            self.public_websockets.discard(websocket)

        await self._handle_disconnected_members(disconnected_member_ids)

    def _can_progress(self) -> bool:
        return self.leader_member_ids.issubset(self.member_id_to_ws_set.keys())

    async def broadcast(self, type: MessageType, data: BaseDTO) -> None:
        websockets: list[WebSocket] = []
        async with self._broadcast_lock:
            for member_websockets in self.member_id_to_ws_set.values():
                websockets.extend(member_websockets)
            websockets.extend(self.public_websockets)

        disconnected_websockets: list[WebSocket] = []
        message = {"type": type, "dto": data.model_dump()}
        for websocket in websockets:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected_websockets.append(websocket)

        disconnected_member_ids: list[int] = []
        if disconnected_websockets:
            async with self._broadcast_lock:
                for websocket in disconnected_websockets:
                    for member_id, member_websockets in list(
                        self.member_id_to_ws_set.items()
                    ):
                        member_websockets.discard(websocket)
                        if not member_websockets:
                            del self.member_id_to_ws_set[member_id]
                            disconnected_member_ids.append(member_id)
                    self.public_websockets.discard(websocket)

        await self._handle_disconnected_members(disconnected_member_ids)

    async def _set_status(self, new_status: AuctionStatus):
        next_member = False

        async with self._state_lock:
            if self.status == AuctionStatus.COMPLETED:
                return

            if self.status == new_status:
                return

            if new_status == AuctionStatus.WAITING:
                if self.status == AuctionStatus.RUNNING:
                    self.was_in_progress = True
                    if not (
                        self.timer_task
                        and not self.timer_task.done()
                        and not self.timer_task.cancelled()
                    ):
                        self.timer = self.preset_snapshot.timer

                self._stop_timer()
                self._start_auto_delete_task()

            elif new_status == AuctionStatus.RUNNING:
                self._cancel_auto_delete_task()

                if self.status == AuctionStatus.WAITING:
                    if self.was_in_progress:
                        self.was_in_progress = False
                        self._start_timer()
                    else:
                        next_member = True

            elif new_status == AuctionStatus.COMPLETED:
                self.current_member_id = None
                self.current_bid = None
                self._stop_timer()
                self._cancel_auto_delete_task()

            self.status = new_status

        if next_member:
            await self._next_member()
            if self.status != new_status:
                return

        await self.broadcast(MessageType.STATUS, StatusDTO(status=int(self.status)))

        if new_status == AuctionStatus.COMPLETED:
            await self.terminate_auction()
            from .auction_manager import auction_manager

            auction_manager.remove_auction(self.auction_id)

    def _stop_timer(self):
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()
        self.timer_task = None

    def _start_timer(self):
        self._stop_timer()
        self.timer_task = asyncio.create_task(self._timer())

    async def _next_member(self) -> None:
        message: tuple[MessageType, BaseDTO] | None = None
        completed = False
        start_timer = False

        async with self._state_lock:
            self._stop_timer()

            incomplete_teams = [
                team for team in self.teams if len(team.member_ids) < self.team_size
            ]
            incomplete_team = (
                incomplete_teams[0] if len(incomplete_teams) == 1 else None
            )
            remaining_members = self.auction_queue + self.unsold_queue
            remaining_slots = (
                self.team_size - len(incomplete_team.member_ids)
                if incomplete_team is not None
                else 0
            )

            if (
                incomplete_team is not None
                and remaining_members
                and len(remaining_members) == remaining_slots
            ):
                self.auction_queue = []
                self.unsold_queue = []
                incomplete_team.member_ids.extend(remaining_members)
                message = (
                    MessageType.MEMBER_SOLD,
                    MemberSoldDTO(teams=self.teams, auction_queue=[], unsold_queue=[]),
                )
                completed = True
            else:
                if not self.auction_queue and self.unsold_queue:
                    self.auction_queue = self.unsold_queue
                    self.unsold_queue = []

                if self.auction_queue:
                    self.current_member_id = self.auction_queue.pop(0)
                    self.current_bid = None
                    self.timer = self.preset_snapshot.timer
                    message = (
                        MessageType.NEXT_MEMBER,
                        NextMemberDTO(
                            member_id=self.current_member_id,
                            auction_queue=self.auction_queue[:],
                            unsold_queue=self.unsold_queue[:],
                        ),
                    )
                    start_timer = True
                else:
                    completed = True

        if message is not None:
            await self.broadcast(*message)

        if completed:
            await self._set_status(AuctionStatus.COMPLETED)
            return

        if start_timer:
            self._start_timer()

    async def _timer(self):
        try:
            while self.timer > 0:
                await self.broadcast(MessageType.TIMER, TimerDTO(timer=self.timer))

                await asyncio.sleep(1)
                self.timer -= 1

            await self.timer_expired()

        except asyncio.CancelledError:
            pass

    async def timer_expired(self):
        message: tuple[MessageType, BaseDTO] | None = None
        async with self._state_lock:
            if self.current_bid is None:
                self.unsold_queue.append(self.current_member_id)
            else:
                team = self.member_id_to_team[self.current_bid.leader_id]
                team.points -= self.current_bid.amount
                team.member_ids.append(self.current_member_id)
                message = (
                    MessageType.MEMBER_SOLD,
                    MemberSoldDTO(
                        teams=self.teams,
                        auction_queue=self.auction_queue[:],
                        unsold_queue=self.unsold_queue[:],
                    ),
                )

        if message is not None:
            await self.broadcast(*message)
        await self._next_member()

    async def place_bid(self, member_id: int, amount: int) -> None:
        message: tuple[MessageType, BaseDTO] | None = None
        async with self._state_lock:
            if member_id not in self.member_id_to_ws_set:
                raise WebSocketError(AuctionErrorCode.BidNotLeader)
            if member_id not in self.leader_member_ids:
                raise WebSocketError(AuctionErrorCode.BidNotLeader)
            team = self.member_id_to_team.get(member_id)
            if team is None:
                raise WebSocketError(AuctionErrorCode.BidNotLeader)
            if self.status != AuctionStatus.RUNNING:
                return
            if self.current_member_id is None:
                return
            if len(team.member_ids) >= self.team_size:
                raise WebSocketError(AuctionErrorCode.BidTeamFull)
            required_members = self.team_size - len(team.member_ids)
            max_allowed_bid = team.points - (required_members - 1)
            if amount > max_allowed_bid:
                raise WebSocketError(AuctionErrorCode.BidTooHighAmount)
            if team.points < amount:
                raise WebSocketError(AuctionErrorCode.BidInsufficientPoints)
            min_bid = (self.current_bid.amount + 1) if self.current_bid else 1
            if amount < min_bid:
                raise WebSocketError(AuctionErrorCode.BidTooLowAmount)
            self.current_bid = Bid(amount=amount, leader_id=member_id)
            message = (
                MessageType.BID_PLACED,
                BidPlacedDTO(
                    team_id=team.team_id,
                    leader_id=team.leader_id,
                    amount=amount,
                ),
            )

        await self.broadcast(*message)
        self.timer = self.preset_snapshot.timer
        self._start_timer()

    async def terminate_auction(self):
        self._stop_timer()

        websockets = []
        for member_websockets in self.member_id_to_ws_set.values():
            websockets.extend(member_websockets)
        websockets.extend(self.public_websockets)
        for websocket in websockets:
            with contextlib.suppress(Exception):
                await websocket.close()

        self.member_id_to_ws_set.clear()
        self.public_websockets.clear()
