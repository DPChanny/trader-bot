from fastapi import WebSocket
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import AuctionStatus, MessageType
from shared.entities.member import Member
from shared.entities.preset_member import PresetMember

from ..auction import Auction, auction_manager
from ..utils.token import decode_token


async def _resolve_member(
    jwt_token: str | None,
    preset_id: int,
    db: AsyncSession,
) -> tuple[int | None, bool, int | None]:
    """Return (member_id, is_leader, team_id) or (None, False, None) for anonymous."""
    if not jwt_token:
        return None, False, None

    try:
        payload = decode_token(jwt_token)
    except Exception:
        return None, False, None

    result = await db.execute(
        select(PresetMember)
        .join(PresetMember.member)
        .where(
            PresetMember.preset_id == preset_id,
            Member.discord_user_id == payload.discord_id,
        )
    )
    pm = result.scalar_one_or_none()
    if pm is None:
        return None, False, None

    return pm.member_id, pm.is_leader, None  # team_id resolved from Auction below


async def handle_websocket_connect(
    websocket: WebSocket,
    auction_id: int,
    jwt_token: str | None,
    db: AsyncSession,
) -> tuple[Auction | None, int | None, bool, int | None]:
    auction = auction_manager.get_auction(auction_id)

    if not auction:
        logger.warning(
            f"WebSocket connect failed: reason=auction_not_found, auction_id={auction_id}"
        )
        await websocket.close(code=4004, reason="Auction not found")
        return None, None, False, None

    member_id, is_leader, _ = await _resolve_member(jwt_token, auction.preset_id, db)

    # Resolve team_id from live auction state
    team_id: int | None = None
    if member_id is not None and is_leader:
        for tid, team in auction.teams.items():
            if team.leader_id == member_id:
                team_id = tid
                break

    await websocket.accept()
    logger.info(f"WebSocket connected: member_id={member_id}, auction_id={auction_id}")

    await auction.connect(websocket, member_id, is_leader, team_id)

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
            logger.warning("Bid rejected: reason=non_leader")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": "Bid rejected"},
                }
            )
            return

        bid_data = message.get("data", {})
        amount = bid_data.get("amount")

        if amount is None:
            logger.warning("Bid rejected: reason=missing_amount")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": "Bid rejected"},
                }
            )
            return

        logger.info(f"Bid placing: amount={amount}")
        bid_result = await auction.place_bid(member_id, amount)

        if not bid_result.get("success"):
            logger.warning(f"Bid failed: error={bid_result.get('error')}")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": bid_result.get("error", "Bid failed")},
                }
            )


async def handle_websocket_disconnect(
    auction: Auction,
    member_id: int | None,
    websocket: WebSocket,
) -> None:
    await auction.disconnect(websocket, member_id)
    logger.info(f"WebSocket disconnected: member_id={member_id}")

    if (
        auction.status == AuctionStatus.IN_PROGRESS
        and not auction.are_all_leaders_connected()
    ):
        logger.warning(
            f"Auction paused: reason=leader_disconnected, member_id={member_id}"
        )
        await auction.set_status(AuctionStatus.WAITING)
