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

from shared.dtos.auction import (
    AuctionDetailDTO,
    AuctionMessageDTO,
    ErrorDTO,
    InitDTO,
    MessageType,
)
from shared.utils.database import get_session
from shared.utils.error import AuctionErrorCode, UnexpectedErrorCode, WSError

from ..auction import Auction
from ..services.auction_ws_service import (
    connect_auction_ws_service,
    disconnect_auction_ws_service,
    handle_auction_ws_service,
)


auction_ws_router = APIRouter(prefix="/auction", tags=["auction_ws"])


async def _send_error(ws: WebSocket, code: int) -> None:
    await ws.send_json(
        AuctionMessageDTO(
            type=MessageType.ERROR,
            data=ErrorDTO(code=code).model_dump(),
        ).model_dump()
    )


@auction_ws_router.websocket("/{auction_id}")
async def auction_ws(
    ws: WebSocket,
    auction_id: int,
    session: AsyncSession = Depends(get_session),
):
    member_id: int | None = None
    auction = None
    try:
        auction, member_id, team_id = await connect_auction_ws_service(
            ws, auction_id, session
        )

        detail = AuctionDetailDTO.model_validate(auction)
        init = InitDTO(
            **detail.model_dump(),
            team_id=team_id,
            member_id=member_id,
        )
        await ws.send_json(
            AuctionMessageDTO(type=MessageType.INIT, data=init.model_dump()).model_dump()
        )

        while True:
            data = await ws.receive_text()
            if len(data) > 1024:
                await _send_error(ws, AuctionErrorCode.Invalid)
                continue
            try:
                message = json.loads(data)
            except Exception:
                await _send_error(ws, AuctionErrorCode.Invalid)
                continue

            try:
                await handle_auction_ws_service(auction, member_id, message)
            except WSError as e:
                function = e.function or handle_auction_ws_service.__name__
                logger.bind(function=function, error_code=e.code).warning("")
                await _send_error(ws, e.code)

            if auction.status == Auction.Status.COMPLETED:
                break

    except WebSocketDisconnect:
        if auction is not None:
            await disconnect_auction_ws_service(auction, member_id, ws)

    except WSError as e:
        function = e.function or auction_ws.__name__
        if e.code < 5000:
            logger.bind(function=function, error_code=e.code).warning("")
        else:
            logger.opt(exception=e.__cause__).bind(
                function=function, error_code=e.code
            ).error("")
        with contextlib.suppress(Exception):
            await _send_error(ws, e.code)
        with contextlib.suppress(Exception):
            await ws.close(code=4000, reason=str(e.code))

    except Exception as e:
        logger.opt(exception=e).bind(
            function=auction_ws.__name__,
            error_code=UnexpectedErrorCode.Internal.value,
        ).error("")
        if auction is not None:
            await disconnect_auction_ws_service(auction, member_id, ws)
        with contextlib.suppress(Exception):
            await ws.close()
