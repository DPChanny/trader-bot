import discord
from fastapi import APIRouter, Depends
from fastapi.responses import Response

from shared.dtos.bot_dto import GetProfileDTO, InviteResultDTO, SendInvitesDTO

from .service import get_profile_service, invite_service
from .utils import get_bot


router = APIRouter()


@router.post("/profile")
async def get_profile_route(dto: GetProfileDTO, bot: discord.Client = Depends(get_bot)):
    profile_bytes = await get_profile_service(dto.discord_id, bot)
    return Response(content=profile_bytes, media_type="image/png")


@router.post("/invite", response_model=InviteResultDTO)
async def invite_route(
    dto: SendInvitesDTO, bot: discord.Client = Depends(get_bot)
) -> InviteResultDTO:
    return await invite_service(dto.invites, bot)


# TODO InviteResultDTO 제거
