from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable

from fastapi import WebSocket
from pydantic import BaseModel

from shared.dtos.auction import AuctionEventType, Status
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode, WSError


class Team(BaseModel):
    team_id: int
    leader_id: int
    member_ids: list[int]
    points: int


class Bid(BaseModel):
    amount: int
    leader_id: int


class Auction:
    def __init__(
        self,
        auction_id: int,
        preset_snapshot: PresetDetailDTO,
        teams: list[Team],
        auction_queue: list[int],
        on_timer_expire: Callable[[], Awaitable[None]],
        unsold_queue: list[int] | None = None,
        status: Status = Status.WAITING,
        player_id: int | None = None,
        bid: Bid | None = None,
    ):
        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot
        self.team_size = preset_snapshot.team_size

        self.teams = teams
        self.auction_queue = auction_queue
        self.unsold_queue = unsold_queue if unsold_queue is not None else []
        self.status = status
        self.player_id = player_id
        self.bid = bid

        self._on_timer_expire = on_timer_expire
        self._leader_member_ids = {
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
        }
        self._member_id_to_team: dict[int, Team] = {
            member_id: team for team in teams for member_id in team.member_ids
        }

        self._member_id_to_ws_sets: dict[int, set[WebSocket]] = {}
        self._public_ws_set: set[WebSocket] = set()
        self._ws_to_member_id: dict[WebSocket, int | None] = {}
        self._bid_cooldown: dict[int, float] = {}

        self._timer_task: asyncio.Task | None = None
        self.timer = preset_snapshot.timer

    @property
    def leader_count(self) -> int:
        return len(self._leader_member_ids)

    def is_leader(self, member_id: int) -> bool:
        return member_id in self._leader_member_ids

    def resolve_sold(self) -> Team | None:
        if self.bid is None or self.player_id is None:
            return None
        team = self._member_id_to_team.get(self.bid.leader_id)
        if team is None:
            return None
        return Team(
            team_id=team.team_id,
            leader_id=team.leader_id,
            member_ids=team.member_ids + [self.player_id],
            points=team.points - self.bid.amount,
        )

    def on_next_player(self) -> None:
        if self.auction_queue:
            self.player_id = self.auction_queue[0]
            self.auction_queue = self.auction_queue[1:]
        else:
            self.player_id = self.unsold_queue[0]
            self.auction_queue = self.unsold_queue[1:]
            self.unsold_queue = []
        self.bid = None
        self.start_timer()

    def on_bid_placed(self, leader_id: int, amount: int) -> None:
        self.bid = Bid(amount=amount, leader_id=leader_id)
        self.start_timer()

    def on_member_sold(self) -> None:
        team = self._member_id_to_team.get(self.bid.leader_id) if self.bid else None
        if team and self.player_id is not None:
            team.member_ids.append(self.player_id)
            team.points -= self.bid.amount
            self._member_id_to_team[self.player_id] = team
        self.player_id = None
        self.bid = None
        self.stop_timer()

    def on_member_unsold(self) -> None:
        if self.player_id is not None:
            self.unsold_queue.append(self.player_id)
        self.player_id = None
        self.bid = None
        self.stop_timer()

    def on_status(self, status: int) -> None:
        self.status = Status(status)

    def connect(self, ws: WebSocket, member_id: int | None) -> bool:
        if member_id is None:
            self._public_ws_set.add(ws)
            self._ws_to_member_id[ws] = None
            return False

        is_new = member_id not in self._member_id_to_ws_sets
        if is_new:
            self._member_id_to_ws_sets[member_id] = set()
        self._member_id_to_ws_sets[member_id].add(ws)
        self._ws_to_member_id[ws] = member_id
        return is_new

    def disconnect(self, ws: WebSocket) -> tuple[int | None, bool]:
        member_id = self._ws_to_member_id.pop(ws, None)

        if member_id is None:
            self._public_ws_set.discard(ws)
            return None, False

        member_ws_set = self._member_id_to_ws_sets.get(member_id)
        if not member_ws_set:
            return member_id, True

        member_ws_set.discard(ws)
        if member_ws_set:
            return member_id, False

        del self._member_id_to_ws_sets[member_id]
        return member_id, True

    async def broadcast(self, event_type: AuctionEventType, payload: dict) -> None:
        ws_list: list[WebSocket] = [
            ws for ws_set in self._member_id_to_ws_sets.values() for ws in ws_set
        ]
        ws_list.extend(self._public_ws_set)

        if not ws_list:
            return

        envelope = {"type": event_type, "payload": payload}
        disconnected: list[WebSocket] = []
        for ws in ws_list:
            try:
                await ws.send_json(envelope)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            self.disconnect(ws)

    def validate_bid(self, leader_id: int, amount: int) -> None:
        if self.status != Status.RUNNING or self.player_id is None:
            return

        now = asyncio.get_event_loop().time()
        if now - self._bid_cooldown.get(leader_id, 0) < 1.0:
            return
        self._bid_cooldown[leader_id] = now

        if leader_id not in self._leader_member_ids:
            raise WSError(AuctionErrorCode.BidNotLeader)

        team = self._member_id_to_team.get(leader_id)
        if not team or len(team.member_ids) >= self.team_size:
            raise WSError(AuctionErrorCode.BidTeamFull)

        remaining_slots = self.team_size - len(team.member_ids)
        if amount > team.points - (remaining_slots - 1):
            raise WSError(AuctionErrorCode.BidTooHigh)
        if amount < ((self.bid.amount + 1) if self.bid else 1):
            raise WSError(AuctionErrorCode.BidTooLow)

    def start_timer(self) -> None:
        self.stop_timer()
        self._timer_task = asyncio.create_task(self._timer())

    def stop_timer(self) -> None:
        if self._timer_task and not self._timer_task.done():
            self._timer_task.cancel()
        self._timer_task = None

    async def _timer(self) -> None:
        try:
            remaining = self.timer
            while remaining > 0:
                await self.broadcast(AuctionEventType.TIMER, {"timer": remaining})
                await asyncio.sleep(1)
                remaining -= 1
            asyncio.create_task(self._on_timer_expire())
        except asyncio.CancelledError:
            pass
