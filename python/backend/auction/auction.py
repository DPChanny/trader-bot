import asyncio
from typing import Any

from fastapi import WebSocket

from shared.dtos.auction import (
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    BidDTO,
    InitPayloadDTO,
    Status,
    StatusPayloadDTO,
    TeamDTO,
    TickPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode, WSError


class Auction:
    def __init__(self, auction_id: int, preset_snapshot: PresetDetailDTO):
        from .auction_repository import AuctionRepository

        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot
        self.repo = AuctionRepository(auction_id)
        self._leader_member_ids = {
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
        }

        self._ws_set: set[WebSocket] = set()
        self._ws_to_leader_id: dict[WebSocket, int] = {}
        self._leader_id_to_ws_set: dict[int, set[WebSocket]] = {}
        self._timer_task: asyncio.Task | None = None
        self._start_task: asyncio.Task | None = None

    @property
    def leader_count(self) -> int:
        return len(self._leader_member_ids)

    def is_leader(self, member_id: int) -> bool:
        return member_id in self._leader_member_ids

    async def connect(self, ws: WebSocket, member_id: int | None, pubsub: Any) -> None:
        auction_detail_dto = await self.repo.get_detail()
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

        self._ws_set.add(ws)
        is_new_leader = False
        if member_id is not None and member_id in self._leader_member_ids:
            self._ws_to_leader_id[ws] = member_id
            is_new_leader = member_id not in self._leader_id_to_ws_set
            self._leader_id_to_ws_set.setdefault(member_id, set()).add(ws)

        if is_new_leader:
            new_leader_count = await self.repo.publish_leader_connected()
            if (
                auction_detail_dto.status == Status.WAITING
                and new_leader_count == self.leader_count
                and await self.repo.acquire_state_lock()
            ):
                await self.repo.publish_status(Status.PENDING)
                await self.repo.release_state_lock()
                self._start_task = asyncio.create_task(self._start())

    async def _start(self) -> None:
        try:
            await asyncio.sleep(5)
        except asyncio.CancelledError:
            return
        finally:
            self._start_task = None
        await self.repo.publish_status(Status.RUNNING)
        await self._next_player()

    async def disconnect(self, ws: WebSocket) -> None:
        self._ws_set.discard(ws)
        leader_id = self._ws_to_leader_id.pop(ws, None)
        if leader_id is not None:
            ws_set = self._leader_id_to_ws_set.get(leader_id)
            if ws_set is not None:
                ws_set.discard(ws)
                if not ws_set:
                    del self._leader_id_to_ws_set[leader_id]
                    await self.repo.publish_leader_disconnected()

    async def place_bid(self, bid: BidDTO) -> None:
        if not self.is_leader(bid.leader_id):
            raise WSError(AuctionErrorCode.BidNotLeader)
        error_code = await self.repo.publish_place_bid(
            bid, self.preset_snapshot.team_size
        )
        if error_code != 0:
            raise WSError(error_code)

    async def on_event(self, envelope: AuctionEventEnvelopeDTO) -> bool:
        match envelope.type:
            case AuctionEventType.NEXT_PLAYER | AuctionEventType.BID_PLACED:
                self.start_timer()
            case AuctionEventType.TIMER_EXPIRED:
                if await self.repo.acquire_timer_lock():
                    try:
                        status, player_id, bid = await self.repo.get_player_state()
                        if status == Status.RUNNING and player_id is not None:
                            if bid is None:
                                await self.repo.publish_member_unsold(player_id)
                            else:
                                team = await self.repo.get_team_by_leader(bid.leader_id)
                                if team is None:
                                    await self.repo.publish_member_unsold(player_id)
                                else:
                                    result_team = TeamDTO(
                                        team_id=team.team_id,
                                        leader_id=team.leader_id,
                                        member_ids=team.member_ids + [player_id],
                                        points=team.points - bid.amount,
                                    )
                                    await self.repo.publish_member_sold(result_team)
                            await self._next_player()
                    finally:
                        await self.repo.release_timer_lock()
                return False
            case AuctionEventType.STATUS:
                status_payload = StatusPayloadDTO.model_validate(envelope.payload)
                if status_payload.status == Status.COMPLETED:
                    self.stop()
                    await self.broadcast(envelope.type, envelope.payload)
                    return True
        await self.broadcast(envelope.type, envelope.payload)
        return False

    def stop(self) -> None:
        self.stop_timer()
        if self._start_task and not self._start_task.done():
            self._start_task.cancel()
        self._start_task = None

    def start_timer(
        self, remaining: int | None = None, *, update_start_time: bool = True
    ) -> None:
        self.stop_timer()
        if update_start_time:
            asyncio.create_task(self.repo.set_timer_started_at())
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

        await self.repo.publish_timer_expired()

    async def _next_player(self) -> None:
        completed = not await self.repo.publish_next_player()
        if completed:
            await self.repo.publish_status(Status.COMPLETED)

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
                await self.disconnect(ws)
