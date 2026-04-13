import contextlib
import json

from fastapi import (
    APIRouter,
    Depends,
    WebSocket,
    WebSocketDisconnect,
)
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auction_dto import (
    AuctionDetailDTO,
    AuctionInitDTO,
    ErrorDTO,
    MessageType,
)
from shared.utils.database import get_session
from shared.utils.error import WebSocketError

from ..auction import Auction
from ..services.auction_websocket_service import (
    handle_websocket_connect,
    handle_websocket_disconnect,
    handle_websocket_message,
)


auction_websocket_router = APIRouter(prefix="/auction", tags=["auction_websocket"])


async def _send_error(websocket: WebSocket, code: int) -> None:
    await websocket.send_json(
        {"type": MessageType.ERROR, "dto": ErrorDTO(code=code).model_dump()}
    )


@auction_websocket_router.websocket("/{auction_id}")
async def auction_websocket(
    websocket: WebSocket,
    auction_id: int,
    session: AsyncSession = Depends(get_session),
):
    member_id: int | None = None
    auction = None
    try:
        auction, member_id, team_id = await handle_websocket_connect(
            websocket, auction_id, session
        )

        detail = AuctionDetailDTO.model_validate(auction)
        init = AuctionInitDTO(
            **detail.model_dump(),
            team_id=team_id,
            member_id=member_id,
        )
        await websocket.send_json({"type": MessageType.INIT, "dto": init.model_dump()})

        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            try:
                await handle_websocket_message(auction, member_id, message)
            except WebSocketError as e:
                await _send_error(websocket, e.code)

            if auction.status == Auction.Status.COMPLETED:
                break

    except WebSocketDisconnect:
        if auction is not None:
            await handle_websocket_disconnect(auction, member_id, websocket)

    except WebSocketError as e:
        with contextlib.suppress(Exception):
            await websocket.close(code=4000, reason=str(e.code))

    except Exception:
        if auction is not None:
            await handle_websocket_disconnect(auction, member_id, websocket)
        with contextlib.suppress(Exception):
            await websocket.close()
