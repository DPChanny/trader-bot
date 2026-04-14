import json
from json import JSONDecodeError

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from loguru import logger
from pydantic import BaseModel, ValidationError
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionDTO,
    AuctionMessageEnvelopeDTO,
    AuctionMessageType,
    AuthPayloadDTO,
    CreateAuctionDTO,
    ErrorPayloadDTO,
    InitPayloadDTO,
    PlaceBidPayloadDTO,
)
from shared.utils.database import get_session
from shared.utils.error import (
    AppErrorCode,
    AuthErrorCode,
    ValidationErrorCode,
    WSError,
)
from shared.utils.router import ws_router

from ..auction import Auction
from ..services.auction_service import (
    connect_service,
    create_auction_service,
    disconnect_service,
    place_bid_service,
)
from ..utils.token import verify_access_token


auction_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/auction", tags=["auction"]
)
auction_ws_router = APIRouter(prefix="/auction", tags=["auction_ws"])


@auction_router.post("", response_model=AuctionDTO)
async def create_auction_route(
    guild_id: int,
    preset_id: int,
    dto: CreateAuctionDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
) -> AuctionDTO:
    return await create_auction_service(guild_id, user_id, preset_id, dto, session)


async def _send_error_message(ws: WebSocket, code: int) -> None:
    await ws.send_json(
        AuctionMessageEnvelopeDTO(
            type=AuctionMessageType.ERROR,
            payload=ErrorPayloadDTO(code=code).model_dump(),
        ).model_dump()
    )


def _get_message_payload[TPayloadDTO: BaseModel](
    message: str,
    message_type: AuctionMessageType,
    message_payload_cls: type[TPayloadDTO],
    error_code: AppErrorCode,
) -> TPayloadDTO:
    if len(message) > 1024:
        raise WSError(ValidationErrorCode.Invalid)

    try:
        message = json.loads(message)
        message_envelope_dto = AuctionMessageEnvelopeDTO.model_validate(message)
        if message_envelope_dto.type != message_type:
            raise WSError(error_code)
        return message_payload_cls.model_validate(message_envelope_dto.payload)
    except WSError:
        raise
    except (ValidationError, JSONDecodeError):
        raise WSError(error_code) from None


@auction_ws_router.websocket("/{auction_id}")
@ws_router(_send_error_message)
async def auction_ws(
    ws: WebSocket,
    auction_id: int,
    session: AsyncSession,
):
    member_id: int | None = None
    auction = None
    try:
        await ws.accept()

        auth_payload_dto = _get_message_payload(
            message=await ws.receive_text(),
            message_type=AuctionMessageType.AUTH,
            message_payload_cls=AuthPayloadDTO,
            error_code=AuthErrorCode.Unauthorized,
        )
        auction, member_id, team_id = await connect_service(
            ws, auction_id, auth_payload_dto, session
        )

        auction_detail_dto = AuctionDetailDTO.model_validate(auction)
        init_payload_dto = InitPayloadDTO(
            **auction_detail_dto.model_dump(),
            team_id=team_id,
            member_id=member_id,
        )
        await ws.send_json(
            AuctionMessageEnvelopeDTO(
                type=AuctionMessageType.INIT,
                payload=init_payload_dto.model_dump(),
            ).model_dump()
        )

        while True:
            try:
                place_bid_payload_dto = _get_message_payload(
                    message=await ws.receive_text(),
                    message_type=AuctionMessageType.PLACE_BID,
                    message_payload_cls=PlaceBidPayloadDTO,
                    error_code=ValidationErrorCode.Invalid,
                )
                await place_bid_service(auction, member_id, place_bid_payload_dto)
            except WSError as e:
                function = e.function or auction_ws.__name__
                logger.bind(function=function, error_code=e.code).warning("")
                await _send_error_message(ws, e.code)
                continue

            if auction.status == Auction.Status.COMPLETED:
                break

    except WebSocketDisconnect:
        if auction is not None:
            await disconnect_service(auction, member_id, ws)

    except Exception:
        if auction is not None:
            await disconnect_service(auction, member_id, ws)
        raise
