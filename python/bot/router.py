from fastapi import APIRouter
from fastapi.responses import Response
from loguru import logger

from shared.dtos.discord_dto import GetProfileRequest, SendAuctionUrlsRequest

from .service import get_profile_bytes, send_auction_urls


router = APIRouter(prefix="/bot", tags=["bot"])


@router.post("/profile")
async def get_profile_route(dto: GetProfileRequest):
    profile_bytes = await get_profile_bytes(dto.discord_id)
    if profile_bytes is None:
        logger.warning(f"Profile not found: discord_id={dto.discord_id}")
        return Response(status_code=404)
    return Response(content=profile_bytes, media_type="image/png")


@router.post("/send-auction-urls", status_code=204)
async def send_auction_urls_route(dto: SendAuctionUrlsRequest):
    await send_auction_urls(dto.invites)
