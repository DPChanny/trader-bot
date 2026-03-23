import logging

from fastapi import WebSocket

from shared.dtos.auction_dto import AuctionStatus, MessageType

from ..auction.auction import Auction
from ..auction.auction_manager import auction_manager


logger = logging.getLogger(__name__)


async def handle_websocket_connect(
    websocket: WebSocket, token: str
) -> tuple[Auction | None, int | None, bool, int | None]:
    auction = auction_manager.get_auction_by_token(token)

    if not auction:
        logger.warning("Connection failed: Auction not found")
        await websocket.close(code=4004, reason="Auction not found")
        return None, None, False, None

    token_info = auction_manager.get_token(token)

    if not token_info:
        logger.warning("Connection failed: Invalid token")
        await websocket.close(code=4001, reason="Invalid token")
        return None, None, False, None

    user_id = token_info.user_id
    is_leader = token_info.is_leader

    await websocket.accept()
    logger.info(f"Connected: {user_id}")

    result = await auction.connect(token, websocket)

    if not result["success"]:
        await websocket.close(code=4003, reason=result["error"])
        return None, None, False, None

    team_id = result.get("team_id")

    return auction, user_id, is_leader, team_id


async def handle_websocket_message(
    websocket: WebSocket,
    auction: Auction,
    token: str,
    message: dict,
    is_leader: bool,
) -> None:
    message_type = message.get("type")

    if message_type == MessageType.PLACE_BID.value:
        if not is_leader:
            logger.warning("Non-leader bid rejected")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": "Only leaders can place bids"},
                }
            )
            return

        bid_data = message.get("data", {})
        amount = bid_data.get("amount")

        if amount is None:
            logger.warning("Bid without amount")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": "Amount required"},
                }
            )
            return

        logger.info(f"Placing bid: {amount}")
        bid_result = await auction.place_bid(token, amount)

        if not bid_result.get("success"):
            logger.warning(f"Bid failed: {bid_result.get('error')}")
            await websocket.send_json(
                {
                    "type": MessageType.ERROR,
                    "data": {"error": bid_result.get("error", "Bid failed")},
                }
            )


async def handle_websocket_disconnect(
    auction: Auction,
    token: str,
    websocket: WebSocket,
) -> None:
    user_id = await auction.disconnect(token, websocket)
    logger.info(f"Disconnected: {user_id}")

    if (
        auction.status == AuctionStatus.IN_PROGRESS
        and not auction.are_all_leaders_connected()
    ):
        logger.warning("Leader disconnected, pausing to WAITING")
        await auction.set_status(AuctionStatus.WAITING)
