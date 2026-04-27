import asyncio
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import WebSocket
from pydantic import BaseModel

from shared.dtos.auction import (
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    TickPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO


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
    ):
        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot
        self._on_timer_expire = on_timer_expire
        self._on_timer_start = on_timer_start
        self._leader_member_ids = {
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
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

    def start_timer(
        self, remaining: int | None = None, *, update_start_time: bool = True
    ) -> None:
        self.stop_timer()
        if update_start_time:
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
