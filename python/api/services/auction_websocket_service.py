import json

from fastapi import WebSocket
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import MessageType
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.utils.error import (
    AuctionErrorCode,
    AuthErrorCode,
    ValidationErrorCode,
    WebSocketError,
)

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


async def handle_websocket_connect(
    websocket: WebSocket,
    auction_id: int,
    session: AsyncSession,
) -> tuple[Auction, int | None, int | None]:
    auction = AuctionManager.get_auction(auction_id)

    if not auction:
        e = WebSocketError(AuctionErrorCode.NotFound)
        e.function = handle_websocket_connect.__name__
        logger.bind(function=e.function, code=e.code, auction_id=auction_id).warning("")
        raise e

    await websocket.accept()

    try:
        auth_message = json.loads(await websocket.receive_text())
    except Exception:
        e = WebSocketError(AuthErrorCode.Unauthorized)
        e.function = handle_websocket_connect.__name__
        logger.bind(function=e.function, code=e.code, auction_id=auction_id).warning("")
        raise e from None

    if auth_message.get("type") != MessageType.AUTH.value:
        e = WebSocketError(AuthErrorCode.Unauthorized)
        e.function = handle_websocket_connect.__name__
        logger.bind(function=e.function, code=e.code, auction_id=auction_id).warning("")
        raise e

    auth_data = auth_message.get("data")
    if not isinstance(auth_data, dict):
        e = WebSocketError(AuthErrorCode.Unauthorized)
        e.function = handle_websocket_connect.__name__
        logger.bind(function=e.function, code=e.code, auction_id=auction_id).warning("")
        raise e

    token = auth_data.get("token")
    if token is not None and not isinstance(token, str):
        e = WebSocketError(AuthErrorCode.Unauthorized)
        e.function = handle_websocket_connect.__name__
        logger.bind(function=e.function, code=e.code, auction_id=auction_id).warning("")
        raise e

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
        e = WebSocketError(AuctionErrorCode.Forbidden)
        e.function = handle_websocket_connect.__name__
        logger.bind(function=e.function, code=e.code, auction_id=auction_id).warning("")
        raise e

    event = {"auction_id": auction_id, "member_id": member_id}
    logger.bind(function=handle_websocket_connect.__name__, **event).info("")

    await auction.connect(websocket, member_id)

    return auction, member_id, team_id


async def handle_websocket_message(
    auction: Auction,
    member_id: int | None,
    message: dict,
) -> None:
    message_type = message.get("type")

    if message_type == MessageType.PLACE_BID.value:
        if member_id is None:
            e = WebSocketError(AuctionErrorCode.BidNotLeader)
            e.function = handle_websocket_message.__name__
            raise e

        bid_data = message.get("data", {})
        amount = bid_data.get("amount")

        if amount is None:
            e = WebSocketError(ValidationErrorCode.Invalid)
            e.function = handle_websocket_message.__name__
            raise e

        try:
            await auction.place_bid(member_id, amount)
        except WebSocketError as e:
            e.function = handle_websocket_message.__name__
            raise

        event = {"member_id": member_id, "amount": amount}
        logger.bind(function=handle_websocket_message.__name__, **event).info("")


async def handle_websocket_disconnect(
    auction: Auction,
    member_id: int | None,
    websocket: WebSocket,
) -> None:
    await auction.disconnect(websocket, member_id)
    logger.bind(
        function=handle_websocket_disconnect.__name__, member_id=member_id
    ).info("")
