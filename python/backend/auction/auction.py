from __future__ import annotations

import asyncio
import random
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import WebSocket

from shared.dtos.auction import AuctionMessageType, Status
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode, WSError


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
    Status = Status

    def __init__(
        self,
        auction_id: int,
        preset_snapshot: PresetDetailDTO,
        is_public: bool,
        publisher: Callable[[int, str, Any], Awaitable[None]] | None = None
    ):
        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot
        self.is_public = is_public
        self.publisher = publisher

        self.guild_id = self.preset_snapshot.guild_id
        self.preset_id = self.preset_snapshot.preset_id
        self.team_size = self.preset_snapshot.team_size
        self.status = Status.WAITING

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

        self._member_id_to_ws_sets: dict[int, set[WebSocket]] = {}
        self._public_ws_set: set[WebSocket] = set()
        self._ws_to_member_id: dict[WebSocket, int | None] = {}
        self._bid_placed: dict[int, float] = {}

        self._timer_task: asyncio.Task | None = None
        self._was_in_progress: bool = False
        self._state_lock = asyncio.Lock()
        self._broadcast_lock = asyncio.Lock()
        self.expires_at: datetime | None = None

    async def handle_redis_event(self, event_type: str, payload: dict[str, Any]) -> None:
        if event_type == AuctionMessageType.STATUS:
            self.status = Status(payload["status"])
            if self.status == Status.WAITING:
                self._stop_timer()
            elif self.status == Status.RUNNING:
                pass
        elif event_type == AuctionMessageType.BID_PLACED:
            self.current_bid = Bid(amount=payload["amount"], leader_id=payload["leader_id"])
            if "expires_at" in payload:
                self.expires_at = datetime.fromisoformat(payload["expires_at"])
                self._start_timer()
        elif event_type == AuctionMessageType.MEMBER_SOLD:
            self.teams = [Team(**t) for t in payload["teams"]]
            self.auction_queue = payload["auction_queue"]
            self.unsold_queue = payload["unsold_queue"]
            self.current_bid = None
            self.current_member_id = None
            self._stop_timer()
        elif event_type == AuctionMessageType.MEMBER_UNSOLD:
            self.unsold_queue = payload["unsold_queue"]
            self.current_bid = None
            self.current_member_id = None
            self._stop_timer()
        elif event_type == AuctionMessageType.NEXT_MEMBER:
            self.current_member_id = payload["member_id"]
            self.auction_queue = payload["auction_queue"]
            self.unsold_queue = payload["unsold_queue"]
            self.current_bid = None
            if "expires_at" in payload:
                self.expires_at = datetime.fromisoformat(payload["expires_at"])
                self._start_timer()

        await self._broadcast_local(event_type, payload)

    async def _broadcast_local(self, message_type: str, payload_data: Any) -> None:
        ws_list: list[WebSocket] = []
        async with self._broadcast_lock:
            for member_ws_set in self._member_id_to_ws_sets.values():
                ws_list.extend(member_ws_set)
            ws_list.extend(self._public_ws_set)

        if not ws_list:
            return

        message_envelope = {"type": message_type, "payload": payload_data}
        disconnected_ws_set: set[WebSocket] = set()
        for ws in ws_list:
            try:
                await ws.send_json(message_envelope)
            except Exception:
                disconnected_ws_set.add(ws)

        for ws in disconnected_ws_set:
            await self.disconnect(ws, None)

    async def connect(self, ws: WebSocket, member_id: int | None) -> None:
        if self.status == Status.COMPLETED:
            return
        if member_id is None:
            self._public_ws_set.add(ws)
            self._ws_to_member_id[ws] = None
            return

        is_new = member_id not in self._member_id_to_ws_sets
        if is_new:
            self._member_id_to_ws_sets[member_id] = set()
        self._member_id_to_ws_sets[member_id].add(ws)
        self._ws_to_member_id[ws] = member_id

        if is_new and self.publisher:
            await self.publisher(self.auction_id, AuctionMessageType.MEMBER_CONNECTED, {"member_id": member_id})
            if member_id in self._leader_member_ids and self.status == Status.WAITING and self._can_progress():
                await self.set_status(Status.RUNNING)

    async def disconnect(self, ws: WebSocket, member_id: int | None) -> None:
        if member_id is None:
            member_id = self._ws_to_member_id.pop(ws, None)
        else:
            self._ws_to_member_id.pop(ws, None)

        if member_id is None:
            self._public_ws_set.discard(ws)
            return

        member_ws_set = self._member_id_to_ws_sets.get(member_id)
        if member_ws_set is None:
            return

        member_ws_set.discard(ws)
        if member_ws_set:
            return

        del self._member_id_to_ws_sets[member_id]
        if self.status == Status.COMPLETED:
            return

        if self.publisher:
            await self.publisher(self.auction_id, AuctionMessageType.MEMBER_DISCONNECTED, {"member_id": member_id})
        if self.status == Status.RUNNING and not self._can_progress():
            await self.set_status(Status.WAITING)

    def _can_progress(self) -> bool:
        return self._leader_member_ids.issubset(self._member_id_to_ws_sets.keys())

    async def set_status(self, new_status: Status):
        async with self._state_lock:
            if self.status == Status.COMPLETED or self.status == new_status:
                return
            if self.publisher:
                await self.publisher(self.auction_id, AuctionMessageType.STATUS, {"status": new_status.value})
            if new_status == Status.RUNNING and self.status == Status.WAITING and not self._was_in_progress:
                await self._next_member()

    def _stop_timer(self):
        if self._timer_task and not self._timer_task.done():
            self._timer_task.cancel()
        self._timer_task = None

    def _start_timer(self):
        self._stop_timer()
        self._timer_task = asyncio.create_task(self._timer())

    async def _next_member(self) -> None:
        async with self._state_lock:
            self._stop_timer()
            incomplete_teams = [t for t in self.teams if len(t.member_ids) < self.team_size]
            incomplete_team = incomplete_teams[0] if len(incomplete_teams) == 1 else None
            remaining_members = self.auction_queue + self.unsold_queue
            remaining_slots = self.team_size - len(incomplete_team.member_ids) if incomplete_team else 0

            if self.publisher:
                if incomplete_team and remaining_members and len(remaining_members) == remaining_slots:
                    incomplete_team.member_ids.extend(remaining_members)
                    await self.publisher(self.auction_id, AuctionMessageType.MEMBER_SOLD, {
                        "teams": [t.__dict__ for t in self.teams],
                        "auction_queue": [],
                        "unsold_queue": []
                    })
                    await self.set_status(Status.COMPLETED)
                else:
                    if not self.auction_queue and self.unsold_queue:
                        self.auction_queue = self.unsold_queue
                        self.unsold_queue = []
                    if self.auction_queue:
                        self.current_member_id = self.auction_queue.pop(0)
                        expires_at = datetime.now(UTC) + timedelta(seconds=self.preset_snapshot.timer)
                        await self.publisher(self.auction_id, AuctionMessageType.NEXT_MEMBER, {
                            "member_id": self.current_member_id,
                            "auction_queue": self.auction_queue,
                            "unsold_queue": self.unsold_queue,
                            "expires_at": expires_at.isoformat()
                        })
                    else:
                        await self.set_status(Status.COMPLETED)

    async def _timer(self):
        try:
            while self.expires_at and (self.expires_at - datetime.now(UTC)).total_seconds() > 0:
                timer_val = int((self.expires_at - datetime.now(UTC)).total_seconds())
                await self._broadcast_local(AuctionMessageType.TIMER, {"timer": timer_val})
                await asyncio.sleep(1)

            async with self._state_lock:
                if self.publisher:
                    if self.current_bid is None:
                        if self.current_member_id is not None:
                            self.unsold_queue.append(self.current_member_id)
                            await self.publisher(self.auction_id, AuctionMessageType.MEMBER_UNSOLD, {
                                "member_id": self.current_member_id,
                                "unsold_queue": self.unsold_queue
                            })
                    else:
                        team = self._member_id_to_team[self.current_bid.leader_id]
                        team.points -= self.current_bid.amount
                        team.member_ids.append(self.current_member_id)
                        await self.publisher(self.auction_id, AuctionMessageType.MEMBER_SOLD, {
                            "teams": [t.__dict__ for t in self.teams],
                            "auction_queue": self.auction_queue,
                            "unsold_queue": self.unsold_queue
                        })
            await self._next_member()
        except asyncio.CancelledError:
            pass

    async def place_bid(self, leader_id: int, amount: int) -> None:
        async with self._state_lock:
            if self.status != Status.RUNNING or self.current_member_id is None:
                return
            now = asyncio.get_event_loop().time()
            if now - self._bid_placed.get(leader_id, 0) < 1.0:
                return
            self._bid_placed[leader_id] = now
            if leader_id not in self._leader_member_ids:
                raise WSError(AuctionErrorCode.BidNotLeader)
            team = self._member_id_to_team.get(leader_id)
            if not team or len(team.member_ids) >= self.team_size:
                raise WSError(AuctionErrorCode.BidTeamFull)

            remaining_slots = self.team_size - len(team.member_ids)
            if amount > (team.points - (remaining_slots - 1)):
                raise WSError(AuctionErrorCode.BidTooHigh)
            if amount < ((self.current_bid.amount + 1) if self.current_bid else 1):
                raise WSError(AuctionErrorCode.BidTooLow)

            if self.publisher:
                expires_at = datetime.now(UTC) + timedelta(seconds=self.preset_snapshot.timer)
                await self.publisher(self.auction_id, AuctionMessageType.BID_PLACED, {
                    "leader_id": leader_id,
                    "amount": amount,
                    "expires_at": expires_at.isoformat()
                })
