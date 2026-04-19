from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDetailDTO
from shared.utils.db import get_session

from ..services.guild_service import get_guild_service, get_guilds_service
from ..utils.token import verify_access_token


guild_router = APIRouter(prefix="/guild", tags=["guild"])


@guild_router.get("", response_model=list[GuildDetailDTO])
async def get_guilds_route(
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_guilds_service(user_id, session)


@guild_router.get("/{guild_id}", response_model=GuildDetailDTO)
async def get_guild_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_guild_service(guild_id, user_id, session)
