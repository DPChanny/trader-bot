import asyncio
import json

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction import (
    AuctionMessageEnvelopeDTO,
    MessageType,
    PlaceBidPayloadDTO,
)
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.utils.error import (
    AuctionErrorCode,
    AuthErrorCode,
    TokenError,
    ValidationErrorCode,
    WSError,
)
from shared.utils.service import ws_service

from ..auction import Auction, AuctionManager
from ..utils.token import AccessToken


@ws_service
async def connect_auction_ws_service(
    ws: WebSocket,
    auction_id: int,
    session: AsyncSession,
    event: dict,
) -> tuple[Auction, int | None, int | None]:
    auction = AuctionManager.get_auction(auction_id)

    if not auction:
        raise WSError(AuctionErrorCode.NotFound)

    await ws.accept()

    try:
        auth_message_raw = json.loads(
            await asyncio.wait_for(ws.receive_text(), timeout=10)
        )
        auth_message_envelope_dto = AuctionMessageEnvelopeDTO.model_validate(
            auth_message_raw
        )
    except Exception:
        raise WSError(AuthErrorCode.Unauthorized) from None

    if auth_message_envelope_dto.type != MessageType.AUTH:
        raise WSError(AuthErrorCode.Unauthorized)

    auth_payload_data = auth_message_envelope_dto.payload
    if not isinstance(auth_payload_data, dict):
        raise WSError(AuthErrorCode.Unauthorized)

    token = auth_payload_data.get("token")
    if token is not None and not isinstance(token, str):
        raise WSError(AuthErrorCode.Unauthorized)

    member_id: int | None = None
    if token:
        try:
            user_id = AccessToken.decode(token).user_id
            pm = await PresetMemberRepository(session).get_by_user_id(
                user_id, auction.preset_id, auction.guild_id
            )
            if pm is not None:
                member_id = pm.member_id
        except TokenError as e:
            raise WSError(e.code) from None

    team_id: int | None = None
    if member_id is not None:
        for team in auction.teams:
            if team.leader_id == member_id:
                team_id = team.team_id
                break

    if member_id is None and not auction.is_public:
        raise WSError(AuctionErrorCode.ForbiddenAccess)

    event |= {"auction_id": auction_id, "member_id": member_id}

    await auction.connect(ws, member_id)

    return auction, member_id, team_id


@ws_service
async def handle_auction_ws_service(
    auction: Auction,
    member_id: int | None,
    message: dict,
    event: dict,
) -> None:
    try:
        message_envelope_dto = AuctionMessageEnvelopeDTO.model_validate(message)
    except Exception:
        raise WSError(ValidationErrorCode.Invalid) from None

    message_type = message_envelope_dto.type

    if message_type == MessageType.PLACE_BID:
        if member_id is None:
            raise WSError(AuthErrorCode.Unauthorized)

        bid_payload_data = message_envelope_dto.payload or {}
        try:
            bid_payload_dto = PlaceBidPayloadDTO.model_validate(bid_payload_data)
        except Exception:
            raise WSError(ValidationErrorCode.Invalid) from None

        await auction.place_bid(member_id, bid_payload_dto.amount)

        event |= {"member_id": member_id, "amount": bid_payload_dto.amount}

    else:
        raise WSError(ValidationErrorCode.Invalid)


@ws_service
async def disconnect_auction_ws_service(
    auction: Auction,
    member_id: int | None,
    ws: WebSocket,
    event: dict,
) -> None:
    await auction.disconnect(ws, member_id)
    event |= {"member_id": member_id}
