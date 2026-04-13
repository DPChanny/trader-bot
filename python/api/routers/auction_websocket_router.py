import json

from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from api.auction.auction import AuctionStatus
from shared.dtos.auction_dto import AuctionDetailDTO, MessageType
from shared.utils.database import get_session

from ..services.auction_websocket_service import (
    handle_websocket_connect,
    handle_websocket_disconnect,
    handle_websocket_message,
)


auction_websocket_router = APIRouter(prefix="/auction", tags=["auction_websocket"])


@auction_websocket_router.websocket("/{auction_id}")
async def auction_websocket(
    websocket: WebSocket,
    auction_id: int,
    session: AsyncSession = Depends(get_session),
):
    auction, member_id, is_leader, team_id = await handle_websocket_connect(
        websocket, auction_id, session
    )

    if not auction:
        return

    try:
        state = AuctionDetailDTO.model_validate(auction).model_dump()
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
            logger.bind(
                action="starting",
                leader_count=len(auction.leader_member_ids),
            ).info("")
            if auction.status == AuctionStatus.WAITING:
                await auction.set_status(AuctionStatus.IN_PROGRESS)
        elif is_leader:
            connected_count = sum(
                1
                for lid in auction.leader_member_ids
                if lid in auction.connected_member_ids
            )
            logger.bind(
                action="leader_joined",
                connected=connected_count,
                total=len(auction.leader_member_ids),
            ).info("")

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            await handle_websocket_message(
                websocket, auction, member_id, message, is_leader
            )

    except WebSocketDisconnect:
        await handle_websocket_disconnect(auction, member_id, websocket)

    except Exception:
        logger.bind(
            action="error", auction_id=auction_id, member_id=member_id
        ).exception("")
        await handle_websocket_disconnect(auction, member_id, websocket)
        await websocket.close()
