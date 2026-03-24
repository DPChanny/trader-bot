import discord
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from shared.dtos.discord_dto import GetProfileRequest, SendAuctionUrlsRequest

from .service import get_profile_service, invite_service
from .utils import get_bot


router = APIRouter()


@router.post("/profile")
async def get_profile_route(
    dto: GetProfileRequest, bot: discord.Client = Depends(get_bot)
):
    profile_bytes = await get_profile_service(dto.discord_id, bot)
    return Response(content=profile_bytes, media_type="image/png")


@router.post("/invite", status_code=204)
async def invite_route(
    dto: SendAuctionUrlsRequest, bot: discord.Client = Depends(get_bot)
):
    await invite_service(dto.invites, bot)
