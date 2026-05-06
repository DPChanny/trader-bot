from loguru import logger

from shared.dtos.auction import AuctionPublishType, AuctionRequestType
from shared.utils.logging import Event


def log_request(
    request_type: AuctionRequestType, *, input=None, result=None, level: str = "INFO"
) -> None:
    logger.bind(
        event=Event(
            Event.Type.AUCTION_SERVICE,
            input=input,
            result=result,
            detail={"request_type": request_type},
        )
    ).log(level, "")


def log_publish(
    publish_type: AuctionPublishType, *, result=None, level: str = "INFO"
) -> None:
    logger.bind(
        event=Event(
            Event.Type.AUCTION_SERVICE,
            result=result,
            detail={"publish_type": publish_type},
        )
    ).log(level, "")
