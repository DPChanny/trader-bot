import contextlib
import json

from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import AuctionDetailDTO, AuctionInitDTO, MessageType
from shared.utils.database import get_session
from shared.utils.error import WebSocketError

from ..auction import AuctionStatus
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
    member_id: int | None = None
    auction = None
    try:
        auction, member_id, is_leader, team_id = await handle_websocket_connect(
            websocket, auction_id, session
        )

        detail = AuctionDetailDTO.model_validate(auction)
        init = AuctionInitDTO(
            **detail.model_dump(),
            team_id=team_id,
            member_id=member_id,
            is_leader=is_leader,
        )
        await websocket.send_json({"type": MessageType.INIT, "dto": init.model_dump()})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            await handle_websocket_message(
                websocket, auction, member_id, message, is_leader
            )

            if auction.status == AuctionStatus.COMPLETED:
                break

    except WebSocketDisconnect:
        if auction is not None:
            await handle_websocket_disconnect(auction, member_id, websocket)

    except WebSocketError as e:
        with contextlib.suppress(Exception):
            await websocket.close(code=4000, reason=str(e.code))

    except Exception:
        logger.bind(
            action="error", auction_id=auction_id, member_id=member_id
        ).exception("")
        if auction is not None:
            await handle_websocket_disconnect(auction, member_id, websocket)
        with contextlib.suppress(Exception):
            await websocket.close()
