import asyncio
import contextlib

from fastapi import WebSocket

from shared.dtos.auction import (
    AuctionPublishEnvelopeDTO,
    AuctionPublishType,
    AuctionRequestType,
    AuctionResponseEnvelopeDTO,
    AuctionResponseType,
    AuctionServerEventEnvelopeDTO,
    AuctionServerEventType,
    BidDTO,
    BidErrorResponsePayloadDTO,
    ErrorEventPayloadDTO,
    InitEventPayloadDTO,
    LeaderConnectedRequestPayloadDTO,
    LeaderDisconnectedRequestPayloadDTO,
    Status,
    StatusEventPayloadDTO,
)
from shared.dtos.preset import PresetDetailDTO
from shared.utils.error import AuctionErrorCode, WSError

from .auction_repository import AuctionRepository
from .utils import log_server_event


class Auction:
    def __init__(self, auction_id: int, preset_snapshot: PresetDetailDTO):
        self.auction_id = auction_id
        self.preset_snapshot = preset_snapshot
        self.repo = AuctionRepository(auction_id)
        self._leader_member_ids = {
            pm.member_id for pm in preset_snapshot.preset_members if pm.is_leader
        }

        self._ws_set: set[WebSocket] = set()
        self._ws_to_leader_id: dict[WebSocket, int] = {}
        self._leader_id_to_ws: dict[int, WebSocket] = {}

    async def connect(self, ws: WebSocket, member_id: int | None) -> None:
        auction_detail_dto = await self.repo.get_detail()
        await ws.send_json(
            AuctionServerEventEnvelopeDTO(
                type=AuctionServerEventType.INIT,
                payload=InitEventPayloadDTO(
                    auction=auction_detail_dto, member_id=member_id
                ),
            ).model_dump(mode="json")
        )
        log_server_event(AuctionServerEventType.INIT, result={"member_id": member_id})

        if auction_detail_dto.status == Status.COMPLETED:
            return

        self._ws_set.add(ws)
        if member_id is not None and member_id in self._leader_member_ids:
            self._ws_to_leader_id[ws] = member_id
            existing_ws = self._leader_id_to_ws.get(member_id)
            self._leader_id_to_ws[member_id] = ws
            if existing_ws is not None:
                self._ws_set.discard(existing_ws)
                self._ws_to_leader_id.pop(existing_ws, None)
                with contextlib.suppress(Exception):
                    await existing_ws.close(code=4001)
            else:
                await self.repo.publish_request(
                    AuctionRequestType.LEADER_CONNECTED,
                    LeaderConnectedRequestPayloadDTO(leader_id=member_id),
                )

    async def disconnect(self, ws: WebSocket) -> None:
        self._ws_set.discard(ws)
        leader_id = self._ws_to_leader_id.pop(ws, None)
        if leader_id is not None and self._leader_id_to_ws.get(leader_id) is ws:
            del self._leader_id_to_ws[leader_id]
            await self.repo.publish_request(
                AuctionRequestType.LEADER_DISCONNECTED,
                LeaderDisconnectedRequestPayloadDTO(leader_id=leader_id),
            )

    async def place_bid(self, dto: BidDTO) -> None:
        if dto.leader_id not in self._leader_member_ids:
            raise WSError(AuctionErrorCode.BidNotLeader)
        await self.repo.publish_request(AuctionRequestType.PLACE_BID, dto)

    async def handle_event(
        self, envelope: AuctionPublishEnvelopeDTO | AuctionResponseEnvelopeDTO
    ) -> bool:
        if isinstance(envelope, AuctionResponseEnvelopeDTO):
            if envelope.type == AuctionResponseType.BID_ERROR:
                payload = BidErrorResponsePayloadDTO.model_validate(envelope.payload)
                ws = self._leader_id_to_ws.get(payload.leader_id)
                if ws is not None:
                    error_msg = AuctionServerEventEnvelopeDTO(
                        type=AuctionServerEventType.ERROR,
                        payload=ErrorEventPayloadDTO(code=payload.code),
                    ).model_dump_json()
                    try:
                        await ws.send_text(error_msg)
                        log_server_event(
                            AuctionServerEventType.ERROR,
                            result={"leader_id": payload.leader_id},
                        )
                    except Exception:
                        await self.disconnect(ws)
            return False

        if envelope.type != AuctionPublishType.TICK:
            log_server_event(
                AuctionServerEventType(envelope.type.value),
                result={"ws_count": len(self._ws_set)},
            )

        match envelope.type:
            case AuctionPublishType.STATUS:
                status_payload = StatusEventPayloadDTO.model_validate(envelope.payload)
                if status_payload.status == Status.COMPLETED:
                    await self.broadcast(envelope)
                    return True
            case AuctionPublishType.EXPIRED:
                await self.broadcast(envelope)
                return True
        await self.broadcast(envelope)
        return False

    async def broadcast(self, envelope: AuctionPublishEnvelopeDTO) -> None:
        if not self._ws_set:
            return
        event_type = AuctionServerEventType(envelope.type.value)
        data = AuctionServerEventEnvelopeDTO(
            type=event_type, payload=envelope.payload
        ).model_dump_json()
        ws_list = list(self._ws_set)
        results = await asyncio.gather(
            *[ws.send_text(data) for ws in ws_list], return_exceptions=True
        )
        for ws, result in zip(ws_list, results, strict=True):
            if isinstance(result, Exception):
                await self.disconnect(ws)
