from loguru import logger

from shared.dtos.auction import AuctionServerEventType
from shared.utils.logging import Event


def log_server_event(
    server_event_type: AuctionServerEventType, *, result=None, level: str = "INFO"
) -> None:
    logger.bind(
        event=Event(
            Event.Type.WS_SERVICE,
            result=result,
            detail={"server_event_type": server_event_type},
        )
    ).log(level, "")
