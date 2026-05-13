import contextlib

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction import (
    AuctionClientEventEnvelopeDTO,
    AuctionClientEventType,
    AuctionDTO,
    AuctionServerEventEnvelopeDTO,
    AuctionServerEventType,
    AuthEventPayloadDTO,
    ErrorEventPayloadDTO,
    PlaceBidEventPayloadDTO,
)
from shared.utils.db import get_session
from shared.utils.error import (
    AppErrorCode,
    InvalidErrorCode,
    UnauthorizedErrorCode,
    WSError,
    handle_ws_error,
)

from ..services.auction_service import (
    connect_service,
    create_auction_service,
    disconnect_service,
    place_bid_service,
)
from ..utils.router import ws_router
from ..utils.token import verify_access_token


auction_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/auction", tags=["auction"]
)


@auction_router.post("", response_model=AuctionDTO)
async def create_auction_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
) -> AuctionDTO:
    return await create_auction_service(guild_id, user_id, preset_id, session)


def _parse_event_envelope(text: str) -> AuctionClientEventEnvelopeDTO:
    if len(text) > 1024:
        raise WSError(InvalidErrorCode.Request)
    try:
        return AuctionClientEventEnvelopeDTO.model_validate_json(text)
    except ValidationError, ValueError:
        raise WSError(InvalidErrorCode.Request) from None


def _parse_event_payload[TPayloadDTO: BaseModel](
    event_envelope: AuctionClientEventEnvelopeDTO,
    payload_cls: type[TPayloadDTO],
    error_code: AppErrorCode,
) -> TPayloadDTO:
    try:
        return payload_cls.model_validate(event_envelope.payload)
    except ValidationError:
        raise WSError(error_code) from None


@auction_router.websocket("/{auction_id}")
@ws_router
async def auction_ws(
    ws: WebSocket, auction_id: int, session: AsyncSession = Depends(get_session)
):
    auction = None
    with contextlib.suppress(WebSocketDisconnect):
        await ws.accept()

        auth_event = _parse_event_envelope(await ws.receive_text())
        if auth_event.type != AuctionClientEventType.AUTH:
            raise WSError(UnauthorizedErrorCode.Auth)
        auth_payload_dto = _parse_event_payload(
            auth_event, AuthEventPayloadDTO, UnauthorizedErrorCode.Auth
        )
        auction, member_id = await connect_service(
            ws, auction_id, auth_payload_dto, session
        )

        while True:
            try:
                place_bid_event = _parse_event_envelope(await ws.receive_text())
                if place_bid_event.type != AuctionClientEventType.PLACE_BID:
                    raise WSError(InvalidErrorCode.Request)

                place_bid_payload_dto = _parse_event_payload(
                    place_bid_event, PlaceBidEventPayloadDTO, InvalidErrorCode.Request
                )
                await place_bid_service(auction, member_id, place_bid_payload_dto)
            except WSError as e:
                handle_ws_error(e)
                await ws.send_json(
                    AuctionServerEventEnvelopeDTO(
                        type=AuctionServerEventType.ERROR,
                        payload=ErrorEventPayloadDTO(code=e.code),
                    ).model_dump(mode="json")
                )
                continue

    if auction is not None:
        await disconnect_service(auction, ws)
