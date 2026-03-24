import json

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)
from loguru import logger

from shared.dtos.auction_dto import AuctionStatus, MessageType

from ..services.auction_websocket_service import (
    handle_websocket_connect,
    handle_websocket_disconnect,
    handle_websocket_message,
)


auction_websocket_router = APIRouter(prefix="/auction", tags=["auction_websocket"])


@auction_websocket_router.websocket("/{token}")
async def auction_websocket(websocket: WebSocket, token: str):
    auction, user_id, is_leader, team_id = await handle_websocket_connect(
        websocket, token
    )

    if not auction:
        return

    try:
        state = auction.get_state().model_dump()
        init = {
            **state,
            "team_id": team_id,
            "user_id": user_id,
            "is_leader": is_leader,
        }
        await websocket.send_json(
            {
                "type": MessageType.INIT,
                "data": init,
            }
        )

        if is_leader and auction.are_all_leaders_connected():
            logger.info(
                f"Auction starting: all_leaders_connected, count={len(auction.leader_user_ids)}"
            )
            if auction.status == AuctionStatus.WAITING:
                await auction.set_status(AuctionStatus.IN_PROGRESS)
        else:
            if is_leader:
                connected_leaders = [
                    uid
                    for uid in auction.leader_user_ids
                    if uid in auction.connected_tokens.values()
                ]
                logger.info(
                    f"WebSocket leader joined: connected={len(connected_leaders)}, total={len(auction.leader_user_ids)}"
                )

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            await handle_websocket_message(
                websocket, auction, token, message, is_leader
            )

    except WebSocketDisconnect:
        await handle_websocket_disconnect(auction, token, websocket)

    except Exception:
        logger.exception(f"WebSocket error: user_id={user_id}")
        await handle_websocket_disconnect(auction, token, websocket)
        await websocket.close()
