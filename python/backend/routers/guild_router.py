from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild_dto import GuildDetailDTO
from shared.utils.database import get_session

from ..services.guild_service import get_guild_detail_service, get_guild_list_service
from ..utils.token import verify_token


guild_router = APIRouter(prefix="/guild", tags=["guild"])


@guild_router.get("", response_model=list[GuildDetailDTO])
async def get_guild_list_route(
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await get_guild_list_service(discord_id, session)


@guild_router.get("/{guild_id}", response_model=GuildDetailDTO)
async def get_guild_detail_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await get_guild_detail_service(guild_id, discord_id, session)
