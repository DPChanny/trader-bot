from __future__ import annotations

import asyncio
import contextlib
import random
import uuid

from fastapi import WebSocket

from shared.dtos.auction_dto import (
    AuctionStateDTO,
    AuctionStatus,
    BidPlacedMessageData,
    MemberSoldMessageData,
    MessageType,
    NextMemberMessageData,
    QueueUpdateMessageData,
    StatusMessageData,
    Team,
    TimerMessageData,
    WebSocketMessage,
)


class Auction:
    def __init__(
        self,
        auction_id: str,
        teams: list[Team],
        member_ids: list[int],
        leader_member_ids: set[int],
        preset_snapshot: dict,
        timer_duration: int = 5,
    ):
        self.auction_id = auction_id
        self.status: AuctionStatus = AuctionStatus.WAITING
        self.teams = {team.team_id: team for team in teams}
        self.leader_member_ids = leader_member_ids
        self.preset_snapshot = preset_snapshot

        self.member_to_team: dict[int, int] = {}
        for team in teams:
            for mid in team.member_id_list:
                self.member_to_team[mid] = team.team_id

        self.connected_members: dict[int, set[WebSocket]] = {}
        self.anonymous_connections: dict[str, WebSocket] = {}

        auction_members = [mid for mid in member_ids if mid not in leader_member_ids]
        shuffled = auction_members.copy()
        random.shuffle(shuffled)
        self.auction_queue = shuffled

        self.unsold_queue: list[int] = []
        self.current_member_id: int | None = None
        self.current_bid: int | None = None
        self.current_bidder: int | None = None
        self.timer_duration = timer_duration
        self.timer = timer_duration
        self.timer_task: asyncio.Task | None = None
        self.auto_delete_task: asyncio.Task | None = None
        self.terminate_task: asyncio.Task | None = None

        self.paused_timer: int | None = None
        self.was_in_progress: bool = False

        self._state_lock = asyncio.Lock()
        self._broadcast_lock = asyncio.Lock()

        self._start_auto_delete_task()

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
        member_id: int | None,
        is_leader: bool,
        team_id: int | None,
    ) -> dict:
        if member_id is not None:
            first_connection = member_id not in self.connected_members
            if first_connection:
                self.connected_members[member_id] = set()
            self.connected_members[member_id].add(websocket)

            if first_connection:
                await self.broadcast(
                    WebSocketMessage(
                        type=MessageType.USER_CONNECTED,
                        data={"user_id": member_id},
                    )
                )
        else:
            conn_id = str(uuid.uuid4())
            self.anonymous_connections[conn_id] = websocket

        return {
            "success": True,
            "member_id": member_id,
            "is_leader": is_leader,
            "team_id": team_id,
        }

    async def disconnect(
        self,
        websocket: WebSocket,
        member_id: int | None,
    ) -> int | None:
        if member_id is not None:
            ws_set = self.connected_members.get(member_id)
            if ws_set is not None:
                ws_set.discard(websocket)
                if not ws_set:
                    del self.connected_members[member_id]
                    await self.broadcast(
                        WebSocketMessage(
                            type=MessageType.USER_DISCONNECTED,
                            data={"user_id": member_id},
                        )
                    )
        else:
            key = next(
                (k for k, v in self.anonymous_connections.items() if v is websocket),
                None,
            )
            if key:
                del self.anonymous_connections[key]

        return member_id

    def are_all_leaders_connected(self) -> bool:
        return self.leader_member_ids.issubset(self.connected_members.keys())

    async def broadcast(self, message: WebSocketMessage):
        all_connections: list[WebSocket] = []
        async with self._broadcast_lock:
            for ws_set in self.connected_members.values():
                all_connections.extend(ws_set)
            all_connections.extend(self.anonymous_connections.values())

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
                    for ws_set in self.connected_members.values():
                        ws_set.discard(ws)
                    for k, v in list(self.anonymous_connections.items()):
                        if v is ws:
                            del self.anonymous_connections[k]

    def get_state(self) -> AuctionStateDTO:
        return AuctionStateDTO(
            auction_id=self.auction_id,
            status=self.status,
            current_member_id=self.current_member_id,
            current_bid=self.current_bid,
            current_bidder=self.current_bidder,
            timer=self.timer,
            teams=list(self.teams.values()),
            auction_queue=self.auction_queue,
            unsold_queue=self.unsold_queue,
            connected_users=list(self.connected_members.keys()),
            preset_snapshot=self.preset_snapshot,
        )

    async def set_status(self, new_status: AuctionStatus):
        next_user = False

        async with self._state_lock:
            if self.status == AuctionStatus.COMPLETED:
                return

            if self.status == new_status:
                return

            if new_status == AuctionStatus.WAITING:
                if self.status == AuctionStatus.IN_PROGRESS:
                    self.was_in_progress = True
                    is_timer_running = (
                        self.timer_task
                        and not self.timer_task.done()
                        and not self.timer_task.cancelled()
                    )
                    self.paused_timer = self.timer if is_timer_running else None

                self._stop_timer()
                self._start_auto_delete_task()

            elif new_status == AuctionStatus.IN_PROGRESS:
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
                self.current_bidder = None
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
            self.timer = self.timer_duration

        self.timer_task = asyncio.create_task(self._timer())

    async def _next_user(self):
        messages: list[WebSocketMessage] = []
        completed = False
        start_timer = False

        async with self._state_lock:
            self._stop_timer()

            incomplete_teams = [
                team for team in self.teams.values() if len(team.member_id_list) < 5
            ]

            if len(incomplete_teams) == 1:
                incomplete_team = incomplete_teams[0]
                for user_id in self.auction_queue + self.unsold_queue:
                    if len(incomplete_team.member_id_list) < 5:
                        incomplete_team.member_id_list.append(user_id)
                    else:
                        self.unsold_queue.append(user_id)
                self.auction_queue = []
                messages.append(
                    WebSocketMessage(
                        type=MessageType.MEMBER_SOLD,
                        data=MemberSoldMessageData(
                            teams=list(self.teams.values())
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
                    self.current_bidder = None
                    self.timer = self.timer_duration
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
            if self.current_bid is None or self.current_bidder is None:
                self.unsold_queue.append(self.current_member_id)
                message = WebSocketMessage(type=MessageType.MEMBER_UNSOLD, data={})
            else:
                team = self.teams[self.current_bidder]
                team.points -= self.current_bid
                team.member_id_list.append(self.current_member_id)
                message = WebSocketMessage(
                    type=MessageType.MEMBER_SOLD,
                    data=MemberSoldMessageData(
                        teams=list(self.teams.values())
                    ).model_dump(),
                )

        await self.broadcast(message)
        await self._next_user()

    async def place_bid(self, member_id: int, amount: int) -> dict:
        message: WebSocketMessage | None = None
        async with self._state_lock:
            if member_id not in self.connected_members:
                return {"success": False, "error": "Not connected"}
            if member_id not in self.leader_member_ids:
                return {"success": False, "error": "Only leaders can place bids"}
            team_id = self.member_to_team.get(member_id)
            if team_id is None:
                return {"success": False, "error": "Team not found"}
            if self.status != AuctionStatus.IN_PROGRESS:
                return {"success": False, "error": "Auction not in progress"}
            if self.current_member_id is None:
                return {"success": False, "error": "No member being auctioned"}
            if team_id not in self.teams:
                return {"success": False, "error": "Team not found"}
            team = self.teams[team_id]
            if len(team.member_id_list) >= 5:
                return {"success": False, "error": "Team already has 5 members"}
            remaining_slots = 5 - len(team.member_id_list)
            max_allowed_bid = team.points - (remaining_slots - 1)
            if amount > max_allowed_bid:
                return {"success": False, "error": "Bid too high."}
            if team.points < amount:
                return {"success": False, "error": "Insufficient points"}
            min_bid = (self.current_bid + 1) if self.current_bid else 1
            if amount < min_bid:
                return {"success": False, "error": f"Bid must be at least {min_bid}"}
            self.current_bid = amount
            self.current_bidder = team_id
            message = WebSocketMessage(
                type=MessageType.BID_PLACED,
                data=BidPlacedMessageData(
                    team_id=team_id,
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
        for ws_set in self.connected_members.values():
            all_ws.extend(ws_set)
        all_ws.extend(self.anonymous_connections.values())
        for ws in all_ws:
            with contextlib.suppress(Exception):
                await ws.close()

        self.connected_members.clear()
        self.anonymous_connections.clear()

    async def _delayed_terminate(self):
        await asyncio.sleep(5)
        await self.terminate_auction()
        from .auction_manager import auction_manager

        auction_manager.remove_auction(self.auction_id)
