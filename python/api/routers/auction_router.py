import json
from json import JSONDecodeError

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from loguru import logger
from pydantic import ValidationError
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
    AuthErrorCode,
    UnexpectedErrorCode,
    ValidationErrorCode,
    WSError,
    handle_ws_error,
)

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


async def _send_error(ws: WebSocket, code: int) -> None:
    await ws.send_json(
        AuctionMessageEnvelopeDTO(
            type=AuctionMessageType.ERROR,
            payload=ErrorPayloadDTO(code=code).model_dump(),
        ).model_dump()
    )


@auction_ws_router.websocket("/{auction_id}")
async def auction_ws(
    ws: WebSocket,
    auction_id: int,
    session: AsyncSession = Depends(get_session),
):
    member_id: int | None = None
    auction = None
    try:
        await ws.accept()

        try:
            auth_data = await ws.receive_text()
            auth_message = json.loads(auth_data)
            auth_message_envelope_dto = AuctionMessageEnvelopeDTO.model_validate(
                auth_message
            )
            if auth_message_envelope_dto.type != AuctionMessageType.AUTH:
                raise WSError(AuthErrorCode.Unauthorized)
            auth_payload_dto = AuthPayloadDTO.model_validate(
                auth_message_envelope_dto.payload
            )

            auction, member_id, team_id = await connect_service(
                ws, auction_id, auth_payload_dto, session
            )
        except (ValidationError, JSONDecodeError):
            raise WSError(AuthErrorCode.Unauthorized) from None

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
            data = await ws.receive_text()
            if len(data) > 1024:
                await _send_error(ws, ValidationErrorCode.Invalid)
                continue
            try:
                message = json.loads(data)
            except Exception:
                await _send_error(ws, ValidationErrorCode.Invalid)
                continue

            try:
                message_envelope_dto = AuctionMessageEnvelopeDTO.model_validate(message)
                if message_envelope_dto.type == AuctionMessageType.PLACE_BID:
                    place_bid_payload_dto = PlaceBidPayloadDTO.model_validate(
                        message_envelope_dto.payload
                    )
                    await place_bid_service(auction, member_id, place_bid_payload_dto)
                else:
                    await _send_error(ws, ValidationErrorCode.Invalid)
                    continue
            except ValidationError:
                await _send_error(ws, ValidationErrorCode.Invalid)
            except WSError as e:
                function = e.function or place_bid_service.__name__
                logger.bind(function=function, error_code=e.code).warning("")
                await _send_error(ws, e.code)

            if auction.status == Auction.Status.COMPLETED:
                break

    except WebSocketDisconnect:
        if auction is not None:
            await disconnect_service(auction, member_id, ws)

    except WSError as e:
        await handle_ws_error(
            e,
            auction_ws.__name__,
            lambda code: _send_error(ws, code),
            lambda code, reason: ws.close(code=code, reason=reason),
        )

    except Exception as e:
        if auction is not None:
            await disconnect_service(auction, member_id, ws)
        ws_error = WSError(UnexpectedErrorCode.Internal)
        ws_error.function = auction_ws.__name__
        ws_error.__cause__ = e
        await handle_ws_error(
            ws_error,
            auction_ws.__name__,
            lambda code: _send_error(ws, code),
            lambda code, reason: ws.close(code=code, reason=reason),
        )
