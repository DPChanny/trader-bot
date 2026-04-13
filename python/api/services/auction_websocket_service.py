import json

from fastapi import WebSocket
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from api.auction.auction import AuctionStatus
from shared.dtos.auction_dto import MessageType
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.utils.error import AuctionErrorCode, AuthErrorCode, ValidationErrorCode

from ..auction import Auction, auction_manager
from ..utils.token import AccessToken


async def _resolve_member(
    token: str | None,
    preset_id: int,
    guild_id: int,
    preset_member_repo: PresetMemberRepository,
) -> tuple[int | None, bool, int | None]:
    if not token:
        return None, False, None

    try:
        user_id = AccessToken.decode(token).user_id
    except Exception:
        return None, False, None

    pm = await preset_member_repo.get_by_user_id(user_id, preset_id, guild_id)
    if pm is None:
        return None, False, None

    return pm.member_id, pm.is_leader, None


async def handle_websocket_connect(
    websocket: WebSocket,
    auction_id: int,
    session: AsyncSession,
) -> tuple[Auction | None, int | None, bool, int | None]:
    auction = auction_manager.get_auction(auction_id)

    if not auction:
        logger.bind(
            action="connect_failed",
            auction_id=auction_id,
            error_code=AuctionErrorCode.NotFound.value,
        ).warning("")
        await websocket.close(code=4000, reason=str(AuctionErrorCode.NotFound.value))
        return None, None, False, None

    await websocket.accept()

    try:
        auth_message = json.loads(await websocket.receive_text())
    except Exception:
        logger.bind(
            action="auth_failed", error_code=AuthErrorCode.Unauthorized.value
        ).warning("")
        await websocket.close(code=4000, reason=str(AuthErrorCode.Unauthorized.value))
        return None, None, False, None

    if auth_message.get("type") != MessageType.AUTH.value:
        logger.bind(
            action="auth_failed", error_code=AuthErrorCode.Unauthorized.value
        ).warning("")
        await websocket.close(code=4000, reason=str(AuthErrorCode.Unauthorized.value))
        return None, None, False, None

    auth_data = auth_message.get("data")
    if not isinstance(auth_data, dict):
        logger.bind(
            action="auth_failed", error_code=AuthErrorCode.Unauthorized.value
        ).warning("")
        await websocket.close(code=4000, reason=str(AuthErrorCode.Unauthorized.value))
        return None, None, False, None

    token = auth_data.get("token")
    if token is not None and not isinstance(token, str):
        logger.bind(
            action="auth_failed", error_code=AuthErrorCode.Unauthorized.value
        ).warning("")
        await websocket.close(code=4000, reason=str(AuthErrorCode.Unauthorized.value))
        return None, None, False, None

    preset_id: int = auction.preset_id
    guild_id: int = auction.guild_id
    preset_member_repo = PresetMemberRepository(session)
    member_id, is_leader, _ = await _resolve_member(
        token, preset_id, guild_id, preset_member_repo
    )

    team_id: int | None = None
    if member_id is not None and is_leader:
        for tid, team in auction.team_id_to_team.items():
            if team.leader_id == member_id:
                team_id = tid
                break

    if member_id is None and not auction.is_public:
        logger.bind(
            action="connect_failed",
            auction_id=auction_id,
            error_code=AuctionErrorCode.Forbidden.value,
        ).warning("")
        await websocket.close(code=4000, reason=str(AuctionErrorCode.Forbidden.value))
        return None, None, False, None

    logger.bind(
        action="connected",
        member_id=member_id,
        auction_id=auction_id,
    ).info("")

    await auction.connect(websocket, member_id)

    return auction, member_id, is_leader, team_id


async def handle_websocket_message(
    websocket: WebSocket,
    auction: Auction,
    member_id: int | None,
    message: dict,
    is_leader: bool,
) -> None:
    message_type = message.get("type")

    if message_type == MessageType.PLACE_BID.value:
        if not is_leader or member_id is None:
            logger.bind(
                action="bid_rejected",
                member_id=member_id,
                error_code=AuctionErrorCode.BidNotLeader.value,
            ).warning("")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"code": AuctionErrorCode.BidNotLeader.value},
                }
            )
            return

        bid_data = message.get("data", {})
        amount = bid_data.get("amount")

        if amount is None:
            logger.bind(
                action="bid_rejected",
                member_id=member_id,
                error_code=ValidationErrorCode.Invalid.value,
            ).warning("")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"code": ValidationErrorCode.Invalid.value},
                }
            )
            return

        logger.bind(action="bid_placing", member_id=member_id, amount=amount).info("")
        bid_result = await auction.place_bid(member_id, amount)

        if not bid_result.get("success"):
            logger.bind(
                action="bid_failed",
                member_id=member_id,
                error_code=bid_result.get("code"),
            ).warning("")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"code": bid_result.get("code")},
                }
            )


async def handle_websocket_disconnect(
    auction: Auction,
    member_id: int | None,
    websocket: WebSocket,
) -> None:
    await auction.disconnect(websocket, member_id)
    logger.bind(action="disconnected", member_id=member_id).info("")

    if (
        auction.status == AuctionStatus.RUNNING
        and not auction.are_all_leaders_connected()
    ):
        logger.bind(
            action="paused", reason="leader_disconnected", member_id=member_id
        ).warning("")
        await auction.set_status(AuctionStatus.WAITING)
