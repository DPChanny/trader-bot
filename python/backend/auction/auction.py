import asyncio
import random
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import WebSocket
from pydantic import BaseModel

from shared.dtos.auction import (
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    Status,
    TickPayloadDTO,
)
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
        on_timer_start: Callable[[], Awaitable[None]],
        teams: list[Team] | None = None,
        auction_queue: list[int] | None = None,
        unsold_queue: list[int] | None = None,
        status: Status = Status.WAITING,
        player_id: int | None = None,
        bid: Bid | None = None,
        connected_leader_count: int = 0,
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
        self.connected_leader_count = connected_leader_count

        self._on_timer_expire = on_timer_expire
        self._on_timer_start = on_timer_start
        self._leader_member_ids = {team.leader_id for team in teams}
        self._member_id_to_team: dict[int, Team] = {
            member_id: team for team in teams for member_id in team.member_ids
        }

        self._ws_set: set[WebSocket] = set()
        self._ws_to_leader_id: dict[WebSocket, int] = {}
        self._leader_id_to_ws_set: dict[int, set[WebSocket]] = {}

        self._timer_task: asyncio.Task | None = None

    @property
    def leader_count(self) -> int:
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

    def on_status(self, status: Status) -> None:
        self.status = status
        if status == Status.COMPLETED:
            self.stop_timer()

    def connect(self, ws: WebSocket, member_id: int | None) -> bool:
        self._ws_set.add(ws)
        if member_id is not None and member_id in self._leader_member_ids:
            self._ws_to_leader_id[ws] = member_id
            is_new_leader = member_id not in self._leader_id_to_ws_set
            self._leader_id_to_ws_set.setdefault(member_id, set()).add(ws)
            return is_new_leader
        return False

    def disconnect(self, ws: WebSocket) -> bool:
        self._ws_set.discard(ws)
        leader_id = self._ws_to_leader_id.pop(ws, None)
        if leader_id is not None:
            ws_set = self._leader_id_to_ws_set.get(leader_id)
            if ws_set is not None:
                ws_set.discard(ws)
                if not ws_set:
                    del self._leader_id_to_ws_set[leader_id]
                    return True
        return False

    async def broadcast(self, event_type: AuctionEventType, payload: Any) -> None:
        if not self._ws_set:
            return

        data = AuctionEventEnvelopeDTO(
            type=event_type, payload=payload
        ).model_dump_json()

        ws_list = list(self._ws_set)
        results = await asyncio.gather(
            *[ws.send_text(data) for ws in ws_list], return_exceptions=True
        )

        for ws, result in zip(ws_list, results, strict=True):
            if isinstance(result, Exception):
                self.disconnect(ws)

    def validate_bid(self, bid: Bid) -> None:
        if self.status != Status.RUNNING or self.player_id is None:
            raise WSError(AuctionErrorCode.BidInvalidState)

        if bid.leader_id not in self._leader_member_ids:
            raise WSError(AuctionErrorCode.BidNotLeader)

        team = self._member_id_to_team.get(bid.leader_id)
        if not team or len(team.member_ids) >= self.preset_snapshot.team_size:
            raise WSError(AuctionErrorCode.BidTeamFull)

        remaining_slots = self.preset_snapshot.team_size - len(team.member_ids)
        if bid.amount > team.points - (remaining_slots - 1):
            raise WSError(AuctionErrorCode.BidInvalidAmount)
        if bid.amount < ((self.bid.amount + 1) if self.bid else 1):
            raise WSError(AuctionErrorCode.BidInvalidAmount)

    def settle(self) -> Team | None:
        if self.player_id is None or self.bid is None:
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

    def start_timer(self, remaining: int | None = None) -> None:
        self.stop_timer()
        asyncio.create_task(self._on_timer_start())
        self._timer_task = asyncio.create_task(
            self._timer(remaining or self.preset_snapshot.timer)
        )

    def stop_timer(self) -> None:
        if self._timer_task and not self._timer_task.done():
            self._timer_task.cancel()
        self._timer_task = None

    async def _timer(self, remaining: int) -> None:
        loop = asyncio.get_running_loop()
        deadline = loop.time() + remaining
        while remaining > 0:
            await self.broadcast(AuctionEventType.TICK, TickPayloadDTO(timer=remaining))
            remaining -= 1
            await asyncio.sleep(max(0, deadline - remaining - loop.time()))
        asyncio.create_task(self._on_timer_expire())
