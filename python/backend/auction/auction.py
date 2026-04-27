import asyncio
from typing import Any

from fastapi import WebSocket

from shared.dtos.auction import (
    AuctionEventEnvelopeDTO,
    AuctionEventType,
    AuctionRequestType,
    AuctionResponseEnvelopeDTO,
    AuctionResponseType,
    BidDTO,
    BidErrorResponsePayloadDTO,
    ErrorPayloadDTO,
    InitPayloadDTO,
    Status,
    StatusPayloadDTO,
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

    @property
    def leader_count(self) -> int:
        return len(self._leader_member_ids)

    def is_leader(self, member_id: int) -> bool:
        return member_id in self._leader_member_ids

    async def connect(self, ws: WebSocket, member_id: int | None) -> None:
        auction_detail_dto = await self.repo.get_detail()
        await ws.send_json(
            AuctionEventEnvelopeDTO(
                type=AuctionEventType.INIT,
                payload=InitPayloadDTO(auction=auction_detail_dto, member_id=member_id),
            ).model_dump(mode="json")
        )

        if auction_detail_dto.status == Status.COMPLETED:
            return

        self._ws_set.add(ws)
        if member_id is not None and member_id in self._leader_member_ids:
            self._ws_to_leader_id[ws] = member_id
            is_new_leader = member_id not in self._leader_id_to_ws_set
            self._leader_id_to_ws_set.setdefault(member_id, set()).add(ws)
            if is_new_leader:
                await self.repo.publish_request(
                    AuctionRequestType.LEADER_CONNECTED, {"member_id": member_id}
                )

    async def disconnect(self, ws: WebSocket) -> None:
        self._ws_set.discard(ws)
        leader_id = self._ws_to_leader_id.pop(ws, None)
        if leader_id is not None:
            ws_set = self._leader_id_to_ws_set.get(leader_id)
            if ws_set is not None:
                ws_set.discard(ws)
                if not ws_set:
                    del self._leader_id_to_ws_set[leader_id]
                    await self.repo.publish_request(
                        AuctionRequestType.LEADER_DISCONNECTED, {"member_id": leader_id}
                    )

    async def place_bid(self, bid: BidDTO) -> None:
        if not self.is_leader(bid.leader_id):
            raise WSError(AuctionErrorCode.BidNotLeader)
        await self.repo.publish_request(AuctionRequestType.PLACE_BID, bid)

    async def on_event(
        self, envelope: AuctionEventEnvelopeDTO | AuctionResponseEnvelopeDTO
    ) -> bool:
        if isinstance(envelope, AuctionResponseEnvelopeDTO):
            if envelope.type == AuctionResponseType.BID_ERROR:
                payload = BidErrorResponsePayloadDTO.model_validate(envelope.payload)
                ws_set = self._leader_id_to_ws_set.get(payload.leader_id, set())
                error_msg = AuctionEventEnvelopeDTO(
                    type=AuctionEventType.ERROR,
                    payload=ErrorPayloadDTO(code=payload.code),
                ).model_dump_json()
                for ws in list(ws_set):
                    try:
                        await ws.send_text(error_msg)
                    except Exception:
                        await self.disconnect(ws)
            return False

        match envelope.type:
            case AuctionEventType.STATUS:
                status_payload = StatusPayloadDTO.model_validate(envelope.payload)
                if status_payload.status == Status.COMPLETED:
                    self.stop()
                    await self.broadcast(envelope.type, envelope.payload)
                    return True
            case AuctionEventType.EXPIRED:
                self.stop()
                await self.broadcast(envelope.type, envelope.payload)
                return True
        await self.broadcast(envelope.type, envelope.payload)
        return False

    def stop(self) -> None:
        self._ws_set.clear()
        self._ws_to_leader_id.clear()
        self._leader_id_to_ws_set.clear()

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
