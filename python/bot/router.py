import discord
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from shared.dtos.bot_dto import InviteDTO

from .service import get_profile_service, invite_service
from .utils import get_bot


router = APIRouter()


@router.get("/profile/{discord_id}")
async def get_profile_route(discord_id: str, bot: discord.Client = Depends(get_bot)):
    profile_bytes = await get_profile_service(discord_id, bot)
    return Response(content=profile_bytes, media_type="image/png")


@router.post("/invite", status_code=204)
async def invite_route(dto: InviteDTO, bot: discord.Client = Depends(get_bot)) -> None:
    await invite_service(dto, bot)
