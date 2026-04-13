import json

from fastapi import WebSocket
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import MessageType
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.utils.error import (
    AuctionErrorCode,
    AuthErrorCode,
    ValidationErrorCode,
    WebSocketError,
)
from shared.utils.service import ws_service

from ..auction import Auction, AuctionManager
from ..utils.token import AccessToken


async def _resolve_member(
    token: str | None,
    preset_id: int,
    guild_id: int,
    preset_member_repo: PresetMemberRepository,
) -> int | None:
    if not token:
        return None

    try:
        user_id = AccessToken.decode(token).user_id
    except Exception:
        return None

    pm = await preset_member_repo.get_by_user_id(user_id, preset_id, guild_id)
    if pm is None:
        return None

    return pm.member_id


@ws_service
async def handle_websocket_connect(
    websocket: WebSocket,
    auction_id: int,
    session: AsyncSession,
    event: dict,
) -> tuple[Auction, int | None, int | None]:
    auction = AuctionManager.get_auction(auction_id)

    if not auction:
        raise WebSocketError(AuctionErrorCode.NotFound)

    await websocket.accept()

    try:
        auth_message = json.loads(await websocket.receive_text())
    except Exception:
        raise WebSocketError(AuthErrorCode.Unauthorized) from None

    if auth_message.get("type") != MessageType.AUTH.value:
        raise WebSocketError(AuthErrorCode.Unauthorized)

    auth_data = auth_message.get("data")
    if not isinstance(auth_data, dict):
        raise WebSocketError(AuthErrorCode.Unauthorized)

    token = auth_data.get("token")
    if token is not None and not isinstance(token, str):
        raise WebSocketError(AuthErrorCode.Unauthorized)

    preset_id: int = auction.preset_id
    guild_id: int = auction.guild_id
    preset_member_repo = PresetMemberRepository(session)
    member_id = await _resolve_member(token, preset_id, guild_id, preset_member_repo)

    team_id: int | None = None
    if member_id is not None:
        for team in auction.teams:
            if team.leader_id == member_id:
                team_id = team.team_id
                break

    if member_id is None and not auction.is_public:
        raise WebSocketError(AuctionErrorCode.Forbidden)

    event |= {"auction_id": auction_id, "member_id": member_id}

    await auction.connect(websocket, member_id)

    return auction, member_id, team_id


@ws_service
async def handle_websocket_message(
    auction: Auction,
    member_id: int | None,
    message: dict,
    event: dict,
) -> None:
    message_type = message.get("type")

    if message_type == MessageType.PLACE_BID.value:
        if member_id is None:
            raise WebSocketError(AuctionErrorCode.BidNotLeader)

        bid_data = message.get("data", {})
        amount = bid_data.get("amount")

        if amount is None:
            raise WebSocketError(ValidationErrorCode.Invalid)

        await auction.place_bid(member_id, amount)

        event |= {"member_id": member_id, "amount": amount}


@ws_service
async def handle_websocket_disconnect(
    auction: Auction,
    member_id: int | None,
    websocket: WebSocket,
    event: dict,
) -> None:
    await auction.disconnect(websocket, member_id)
    event |= {"member_id": member_id}
