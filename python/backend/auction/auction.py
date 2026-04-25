import asyncio
import random
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
        on_timer_expire: Callable[[], Awaitable[None]],
        teams: list[Team] | None = None,
        auction_queue: list[int] | None = None,
        unsold_queue: list[int] | None = None,
        status: Status = Status.WAITING,
        player_id: int | None = None,
        bid: Bid | None = None,
    ):
        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot

        if teams is None:
            leader_ids = [
                pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
            ]
            teams = [
                Team(
                    team_id=i,
                    leader_id=leader_id,
                    member_ids=[leader_id],
                    points=preset_snapshot.points,
                )
                for i, leader_id in enumerate(leader_ids)
            ]

        if auction_queue is None:
            non_leader_ids = [
                pm.member_id
                for pm in preset_snapshot.preset_members
                if not pm.is_leader
            ]
            random.shuffle(non_leader_ids)
            auction_queue = non_leader_ids

        self.teams = teams
        self.auction_queue = auction_queue
        self.unsold_queue = unsold_queue if unsold_queue is not None else []
        self.status = status
        self.player_id = player_id
        self.bid = bid

        self._on_timer_expire = on_timer_expire
        self._leader_member_ids = {team.leader_id for team in teams}
        self._member_id_to_team: dict[int, Team] = {
            member_id: team for team in teams for member_id in team.member_ids
        }

        self._ws_set: set[WebSocket] = set()

        self._timer_task: asyncio.Task | None = None

    @property
    def connected_leader_count(self) -> int:
        return len(self._leader_member_ids)

    def is_leader(self, member_id: int) -> bool:
        return member_id in self._leader_member_ids

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

    def on_bid_placed(self, bid: Bid) -> None:
        self.bid = bid
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

    def connect(self, ws: WebSocket, member_id: int | None) -> None:
        self._ws_set.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._ws_set.discard(ws)

    async def broadcast(self, event_type: AuctionEventType, payload: dict) -> None:
        if not self._ws_set:
            return

        event = {"type": event_type, "payload": payload}
        invalid_ws_set: set[WebSocket] = set()
        for ws in self._ws_set:
            try:
                await ws.send_json(event)
            except Exception:
                invalid_ws_set.add(ws)

        for ws in invalid_ws_set:
            self.disconnect(ws)

    def validate_bid(self, bid: Bid) -> None:
        if self.status != Status.RUNNING or self.player_id is None:
            return

        if bid.leader_id not in self._leader_member_ids:
            raise WSError(AuctionErrorCode.BidNotLeader)

        team = self._member_id_to_team.get(bid.leader_id)
        if not team or len(team.member_ids) >= self.preset_snapshot.team_size:
            raise WSError(AuctionErrorCode.BidTeamFull)

        remaining_slots = self.preset_snapshot.team_size - len(team.member_ids)
        if bid.amount > team.points - (remaining_slots - 1):
            raise WSError(AuctionErrorCode.BidTooHigh)
        if bid.amount < ((self.bid.amount + 1) if self.bid else 1):
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
            remaining = self.preset_snapshot.timer
            while remaining > 0:
                await self.broadcast(AuctionEventType.TIMER, {"timer": remaining})
                await asyncio.sleep(1)
                remaining -= 1
            asyncio.create_task(self._on_timer_expire())
        except asyncio.CancelledError:
            pass
