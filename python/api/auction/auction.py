from __future__ import annotations

import asyncio
import contextlib
import random
import uuid
from dataclasses import dataclass
from enum import IntEnum

from fastapi import WebSocket

from shared.dtos.auction_dto import (
    BidPlacedMessageData,
    MemberSoldMessageData,
    MessageType,
    NextMemberMessageData,
    QueueUpdateMessageData,
    StatusMessageData,
    TeamDTO,
    TimerMessageData,
    WebSocketMessage,
)
from shared.dtos.preset_dto import PresetDetailDTO
from shared.utils.error import AuctionErrorCode


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
        self.guild_id = preset_snapshot.guild_id
        self.preset_id = preset_snapshot.preset_id
        self.initial_timer = preset_snapshot.timer
        self.timer = preset_snapshot.timer
        self.team_size = preset_snapshot.team_size
        self.is_public = is_public
        self.status: AuctionStatus = AuctionStatus.WAITING
        self.preset_snapshot = preset_snapshot

        preset_members = preset_snapshot.preset_members
        leaders = [pm for pm in preset_members if pm.is_leader]
        self.leader_member_ids = {pm.member_id for pm in leaders}

        self.teams = [
            Team(
                team_id=team_id,
                leader_id=leader.member_id,
                member_ids=[leader.member_id],
                points=preset_snapshot.points,
            )
            for team_id, leader in enumerate(leaders)
        ]

        self.member_id_to_team: dict[int, Team] = {}
        for team in self.teams:
            for member_id in team.member_ids:
                self.member_id_to_team[member_id] = team

        self.preset_member_websockets: dict[int, set[WebSocket]] = {}
        self.public_websockets: dict[str, WebSocket] = {}

        all_member_ids = [pm.member_id for pm in preset_members]
        auction_members = [
            mid for mid in all_member_ids if mid not in self.leader_member_ids
        ]
        shuffled = auction_members.copy()
        random.shuffle(shuffled)
        self.auction_queue = shuffled

        self.unsold_queue: list[int] = []
        self.current_member_id: int | None = None
        self.current_bid: Bid | None = None

        self.timer_task: asyncio.Task | None = None
        self.auto_delete_task: asyncio.Task | None = None
        self.terminate_task: asyncio.Task | None = None

        self.paused_timer: int | None = None
        self.was_in_progress: bool = False

        self._state_lock = asyncio.Lock()
        self._broadcast_lock = asyncio.Lock()

        self._start_auto_delete_task()

    @property
    def connected_preset_member_ids(self) -> list[int]:
        return list(self.preset_member_websockets.keys())

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

    async def connect(
        self,
        websocket: WebSocket,
        preset_member_id: int | None,
    ) -> dict:
        if preset_member_id is not None:
            is_new = preset_member_id not in self.preset_member_websockets
            if is_new:
                self.preset_member_websockets[preset_member_id] = set()
            self.preset_member_websockets[preset_member_id].add(websocket)

            if is_new:
                await self.broadcast(
                    WebSocketMessage(
                        type=MessageType.USER_CONNECTED,
                        data={"user_id": preset_member_id},
                    )
                )
        else:
            public_id = str(uuid.uuid4())
            self.public_websockets[public_id] = websocket

        return {
            "success": True,
            "member_id": preset_member_id,
        }

    async def disconnect(
        self,
        websocket: WebSocket,
        preset_member_id: int | None,
    ) -> int | None:
        if preset_member_id is not None:
            ws_set = self.preset_member_websockets.get(preset_member_id)
            if ws_set is not None:
                ws_set.discard(websocket)
                if not ws_set:
                    del self.preset_member_websockets[preset_member_id]
                    await self.broadcast(
                        WebSocketMessage(
                            type=MessageType.USER_DISCONNECTED,
                            data={"user_id": preset_member_id},
                        )
                    )
        else:
            key = next(
                (k for k, v in self.public_websockets.items() if v is websocket),
                None,
            )
            if key:
                del self.public_websockets[key]

        return preset_member_id

    def are_all_leaders_connected(self) -> bool:
        return self.leader_member_ids.issubset(self.preset_member_websockets.keys())

    async def broadcast(self, message: WebSocketMessage):
        all_connections: list[WebSocket] = []
        async with self._broadcast_lock:
            for ws_set in self.preset_member_websockets.values():
                all_connections.extend(ws_set)
            all_connections.extend(self.public_websockets.values())

        disconnected: list[WebSocket] = []
        message_dict = message.model_dump()
        for ws in all_connections:
            try:
                await ws.send_json(message_dict)
            except Exception:
                disconnected.append(ws)

        if disconnected:
            async with self._broadcast_lock:
                for ws in disconnected:
                    for ws_set in self.preset_member_websockets.values():
                        ws_set.discard(ws)
                    for k, v in list(self.public_websockets.items()):
                        if v is ws:
                            del self.public_websockets[k]

    async def set_status(self, new_status: AuctionStatus):
        next_user = False

        async with self._state_lock:
            if self.status == AuctionStatus.COMPLETED:
                return

            if self.status == new_status:
                return

            if new_status == AuctionStatus.WAITING:
                if self.status == AuctionStatus.RUNNING:
                    self.was_in_progress = True
                    is_timer_running = (
                        self.timer_task
                        and not self.timer_task.done()
                        and not self.timer_task.cancelled()
                    )
                    self.paused_timer = self.timer if is_timer_running else None

                self._stop_timer()
                self._start_auto_delete_task()

            elif new_status == AuctionStatus.RUNNING:
                self._cancel_auto_delete_task()

                if self.status == AuctionStatus.WAITING:
                    if self.was_in_progress:
                        self.was_in_progress = False
                        self._start_timer()
                    else:
                        next_user = True

            elif new_status == AuctionStatus.COMPLETED:
                self.current_member_id = None
                self.current_bid = None
                self._stop_timer()
                self._cancel_auto_delete_task()
                self.terminate_task = asyncio.create_task(self._delayed_terminate())

            self.status = new_status

        if next_user:
            await self._next_user()

        await self.broadcast(
            WebSocketMessage(
                type=MessageType.STATUS,
                data=StatusMessageData(status=str(int(self.status))).model_dump(),
            )
        )

    def _stop_timer(self):
        if self.timer_task and not self.timer_task.done():
            self.timer_task.cancel()
        self.timer_task = None

    def _start_timer(self):
        self._stop_timer()

        if self.paused_timer is not None:
            self.timer = self.paused_timer
            self.paused_timer = None
        else:
            self.timer = self.initial_timer

        self.timer_task = asyncio.create_task(self._timer())

    async def _next_user(self):
        messages: list[WebSocketMessage] = []
        completed = False
        start_timer = False

        async with self._state_lock:
            self._stop_timer()

            incomplete_teams = [
                team for team in self.teams if len(team.member_ids) < self.team_size
            ]

            if len(incomplete_teams) == 1:
                incomplete_team = incomplete_teams[0]
                for user_id in self.auction_queue + self.unsold_queue:
                    if len(incomplete_team.member_ids) < self.team_size:
                        incomplete_team.member_ids.append(user_id)
                    else:
                        self.unsold_queue.append(user_id)
                self.auction_queue = []
                messages.append(
                    WebSocketMessage(
                        type=MessageType.MEMBER_SOLD,
                        data=MemberSoldMessageData(
                            teams=[TeamDTO.model_validate(t) for t in self.teams]
                        ).model_dump(),
                    )
                )
                messages.append(
                    WebSocketMessage(
                        type=MessageType.QUEUE_UPDATE,
                        data=QueueUpdateMessageData(
                            auction_queue=[],
                            unsold_queue=self.unsold_queue[:],
                        ).model_dump(),
                    )
                )
                completed = True
            else:
                if not self.auction_queue and self.unsold_queue:
                    self.auction_queue = self.unsold_queue
                    self.unsold_queue = []

                if self.auction_queue:
                    self.current_member_id = self.auction_queue.pop(0)
                    self.current_bid = None
                    self.timer = self.initial_timer
                    messages.append(
                        WebSocketMessage(
                            type=MessageType.NEXT_MEMBER,
                            data=NextMemberMessageData(
                                member_id=self.current_member_id
                            ).model_dump(),
                        )
                    )
                    messages.append(
                        WebSocketMessage(
                            type=MessageType.QUEUE_UPDATE,
                            data=QueueUpdateMessageData(
                                auction_queue=self.auction_queue[:],
                                unsold_queue=self.unsold_queue[:],
                            ).model_dump(),
                        )
                    )
                    start_timer = True
                else:
                    completed = True

        for msg in messages:
            await self.broadcast(msg)

        if completed:
            await self.set_status(AuctionStatus.COMPLETED)
            return

        if start_timer:
            self._start_timer()

    async def _timer(self):
        try:
            while self.timer > 0:
                await self.broadcast(
                    WebSocketMessage(
                        type=MessageType.TIMER,
                        data=TimerMessageData(timer=self.timer).model_dump(),
                    )
                )

                await asyncio.sleep(1)
                self.timer -= 1

            await self.timer_expired()

        except asyncio.CancelledError:
            pass

    async def timer_expired(self):
        message: WebSocketMessage
        async with self._state_lock:
            if self.current_bid is None:
                self.unsold_queue.append(self.current_member_id)
                message = WebSocketMessage(type=MessageType.MEMBER_UNSOLD, data={})
            else:
                team = self.member_id_to_team[self.current_bid.leader_id]
                team.points -= self.current_bid.amount
                team.member_ids.append(self.current_member_id)
                message = WebSocketMessage(
                    type=MessageType.MEMBER_SOLD,
                    data=MemberSoldMessageData(
                        teams=[TeamDTO.model_validate(t) for t in self.teams]
                    ).model_dump(),
                )

        await self.broadcast(message)
        await self._next_user()

    async def place_bid(self, member_id: int, amount: int) -> dict:
        message: WebSocketMessage | None = None
        async with self._state_lock:
            if member_id not in self.preset_member_websockets:
                return {"success": False, "code": AuctionErrorCode.BidNotLeader.value}
            if member_id not in self.leader_member_ids:
                return {"success": False, "code": AuctionErrorCode.BidNotLeader.value}
            team = self.member_id_to_team.get(member_id)
            if team is None:
                return {
                    "success": False,
                    "code": AuctionErrorCode.BidTeamNotFound.value,
                }
            if self.status != AuctionStatus.RUNNING:
                return {"success": True}
            if self.current_member_id is None:
                return {
                    "success": False,
                    "code": AuctionErrorCode.BidMemberNotFound.value,
                }
            if len(team.member_ids) >= self.team_size:
                return {"success": False, "code": AuctionErrorCode.BidTeamFull.value}
            remaining_slots = self.team_size - len(team.member_ids)
            max_allowed_bid = team.points - (remaining_slots - 1)
            if amount > max_allowed_bid:
                return {
                    "success": False,
                    "code": AuctionErrorCode.BidTooHighAmount.value,
                }
            if team.points < amount:
                return {
                    "success": False,
                    "code": AuctionErrorCode.BidInsufficientPoints.value,
                }
            min_bid = (self.current_bid.amount + 1) if self.current_bid else 1
            if amount < min_bid:
                return {
                    "success": False,
                    "code": AuctionErrorCode.BidTooLowAmount.value,
                }
            self.current_bid = Bid(amount=amount, leader_id=member_id)
            message = WebSocketMessage(
                type=MessageType.BID_PLACED,
                data=BidPlacedMessageData(
                    team_id=team.team_id,
                    leader_id=team.leader_id,
                    amount=amount,
                ).model_dump(),
            )

        await self.broadcast(message)
        self._start_timer()
        return {"success": True}

    async def terminate_auction(self):
        self._stop_timer()

        all_ws: list[WebSocket] = []
        for ws_set in self.preset_member_websockets.values():
            all_ws.extend(ws_set)
        all_ws.extend(self.public_websockets.values())
        for ws in all_ws:
            with contextlib.suppress(Exception):
                await ws.close()

        self.preset_member_websockets.clear()
        self.public_websockets.clear()

    async def _delayed_terminate(self):
        await asyncio.sleep(5)
        await self.terminate_auction()
        from .auction_manager import auction_manager

        auction_manager.remove_auction(self.auction_id)
