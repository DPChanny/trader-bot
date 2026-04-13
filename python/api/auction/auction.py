from __future__ import annotations

import asyncio
import random
from dataclasses import dataclass
from datetime import datetime, timedelta
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


_AUCTION_EXPIRATION_MINUTES = 10


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
    _exp_delta = timedelta(minutes=_AUCTION_EXPIRATION_MINUTES)

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
        self._leader_member_ids = {pm.member_id for pm in leaders}

        self.teams = [
            Team(
                team_id=team_id,
                leader_id=leader.member_id,
                member_ids=[leader.member_id],
                points=self.preset_snapshot.points,
            )
            for team_id, leader in enumerate(leaders)
        ]

        self._member_id_to_team: dict[int, Team] = {}
        for team in self.teams:
            for member_id in team.member_ids:
                self._member_id_to_team[member_id] = team

        auction_members = [
            pm.member_id
            for pm in preset_members
            if pm.member_id not in self._leader_member_ids
        ]
        random.shuffle(auction_members)
        self.auction_queue: list[int] = auction_members
        self.unsold_queue: list[int] = []
        self.current_member_id: int | None = None
        self.current_bid: Bid | None = None
        self.timer = self.preset_snapshot.timer

        self._member_id_to_ws_set: dict[int, set[WebSocket]] = {}
        self._public_websockets: set[WebSocket] = set()

        self._timer_task: asyncio.Task | None = None
        self._was_in_progress: bool = False
        self._state_lock = asyncio.Lock()
        self._broadcast_lock = asyncio.Lock()
        self.exp: datetime = datetime.now() + self._exp_delta

    @property
    def connected_member_ids(self) -> list[int]:
        return list(self._member_id_to_ws_set.keys())

    async def connect(self, websocket: WebSocket, member_id: int | None) -> None:
        if self.status == AuctionStatus.COMPLETED:
            return
        if member_id is None:
            self._public_websockets.add(websocket)
            return

        is_new = member_id not in self._member_id_to_ws_set
        if is_new:
            self._member_id_to_ws_set[member_id] = set()
        self._member_id_to_ws_set[member_id].add(websocket)

        if is_new:
            await self._broadcast(
                MessageType.MEMBER_CONNECTED,
                MemberConnectionDTO(member_id=member_id),
            )

            if (
                member_id in self._leader_member_ids
                and self.status == AuctionStatus.WAITING
                and self._can_progress()
            ):
                await self.set_status(AuctionStatus.RUNNING)

    async def disconnect(self, websocket: WebSocket, member_id: int | None) -> None:
        if member_id is None:
            for (
                connected_member_id,
                member_websockets,
            ) in self._member_id_to_ws_set.items():
                if websocket in member_websockets:
                    member_id = connected_member_id
                    break

        if member_id is None:
            self._public_websockets.discard(websocket)
            return

        member_websockets = self._member_id_to_ws_set.get(member_id)
        if member_websockets is None:
            return

        member_websockets.discard(websocket)
        if member_websockets:
            return

        del self._member_id_to_ws_set[member_id]
        if self.status == AuctionStatus.COMPLETED:
            return

        await self._broadcast(
            MessageType.MEMBER_DISCONNECTED,
            MemberConnectionDTO(member_id=member_id),
        )

        if self.status == AuctionStatus.RUNNING and not self._can_progress():
            await self.set_status(AuctionStatus.WAITING)

    def _can_progress(self) -> bool:
        return self._leader_member_ids.issubset(self._member_id_to_ws_set.keys())

    async def _broadcast(self, message_type: MessageType, dto: BaseDTO) -> None:
        websockets: list[WebSocket] = []
        async with self._broadcast_lock:
            for member_websockets in self._member_id_to_ws_set.values():
                websockets.extend(member_websockets)
            websockets.extend(self._public_websockets)

        disconnected_websockets: list[WebSocket] = []
        message = {"type": message_type, "dto": dto.model_dump()}
        for websocket in websockets:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected_websockets.append(websocket)

        for websocket in disconnected_websockets:
            await self.disconnect(websocket, None)

    async def set_status(self, new_status: AuctionStatus):
        next_member = False

        async with self._state_lock:
            if self.status == AuctionStatus.COMPLETED:
                return

            if self.status == new_status:
                return

            if new_status == AuctionStatus.WAITING:
                if self.status == AuctionStatus.RUNNING:
                    self._was_in_progress = True
                    if not (
                        self._timer_task
                        and not self._timer_task.done()
                        and not self._timer_task.cancelled()
                    ):
                        self.timer = self.preset_snapshot.timer

                self._stop_timer()
                self.exp = datetime.now() + self._exp_delta

            elif new_status == AuctionStatus.RUNNING:
                if self.status == AuctionStatus.WAITING:
                    if self._was_in_progress:
                        self._was_in_progress = False
                        self._start_timer()
                    else:
                        next_member = True

            elif new_status == AuctionStatus.COMPLETED:
                self.current_member_id = None
                self.current_bid = None
                self._stop_timer()

            self.status = new_status

        if next_member:
            await self._next_member()
            if self.status != new_status:
                return

        await self._broadcast(MessageType.STATUS, StatusDTO(status=int(self.status)))

    def _stop_timer(self):
        if self._timer_task and not self._timer_task.done():
            self._timer_task.cancel()
        self._timer_task = None

    def _start_timer(self):
        self._stop_timer()
        self._timer_task = asyncio.create_task(self._timer())

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
            await self._broadcast(*message)

        if completed:
            await self.set_status(AuctionStatus.COMPLETED)
            return

        if start_timer:
            self._start_timer()

    async def _timer(self):
        try:
            while self.timer > 0:
                await self._broadcast(MessageType.TIMER, TimerDTO(timer=self.timer))

                await asyncio.sleep(1)
                self.timer -= 1

            message: tuple[MessageType, BaseDTO] | None = None
            async with self._state_lock:
                if self.current_bid is None:
                    if self.current_member_id is not None:
                        self.unsold_queue.append(self.current_member_id)
                else:
                    team = self._member_id_to_team[self.current_bid.leader_id]
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
                await self._broadcast(*message)
            await self._next_member()

        except asyncio.CancelledError:
            pass

    async def place_bid(self, member_id: int, amount: int) -> None:
        message: tuple[MessageType, BaseDTO] | None = None
        async with self._state_lock:
            if self.status != AuctionStatus.RUNNING:
                return
            if self.current_member_id is None:
                return
            if member_id not in self._member_id_to_ws_set:
                raise WebSocketError(AuctionErrorCode.BidNotLeader)
            if member_id not in self._leader_member_ids:
                raise WebSocketError(AuctionErrorCode.BidNotLeader)
            team = self._member_id_to_team.get(member_id)
            if team is None:
                raise WebSocketError(AuctionErrorCode.BidNotLeader)
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

        await self._broadcast(*message)
        self.timer = self.preset_snapshot.timer
        self._start_timer()
