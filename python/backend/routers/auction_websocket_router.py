import json

from fastapi import (
    APIRouter,
    Depends,
    Query,
    WebSocket,
    WebSocketDisconnect,
)
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import AuctionStatus, MessageType
from shared.utils.database import get_db

from ..services.auction_websocket_service import (
    handle_websocket_connect,
    handle_websocket_disconnect,
    handle_websocket_message,
)


auction_websocket_router = APIRouter(prefix="/auction", tags=["auction_websocket"])


@auction_websocket_router.websocket("/{auction_id}")
async def auction_websocket(
    websocket: WebSocket,
    auction_id: str,
    token: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    auction, member_id, is_leader, team_id = await handle_websocket_connect(
        websocket, auction_id, token, db
    )

    if not auction:
        return

    try:
        state = auction.get_state().model_dump()
        init = {
            **state,
            "team_id": team_id,
            "member_id": member_id,
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
                f"Auction starting: all_leaders_connected, count={len(auction.leader_member_ids)}"
            )
            if auction.status == AuctionStatus.WAITING:
                await auction.set_status(AuctionStatus.IN_PROGRESS)
        elif is_leader:
            connected_count = sum(
                1
                for lid in auction.leader_member_ids
                if lid in auction.connected_members
            )
            logger.info(
                f"WebSocket leader joined: connected={connected_count}, total={len(auction.leader_member_ids)}"
            )

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            await handle_websocket_message(
                websocket, auction, member_id, message, is_leader
            )

    except WebSocketDisconnect:
        await handle_websocket_disconnect(auction, member_id, websocket)

    except Exception:
        logger.exception(f"WebSocket error: member_id={member_id}")
        await handle_websocket_disconnect(auction, member_id, websocket)
        await websocket.close()
