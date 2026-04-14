from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDetailDTO
from shared.repositories.guild_repository import GuildRepository
from shared.utils.error import GuildErrorCode, HTTPError
from shared.utils.service import http_service

from ..utils.member import verify_role


@http_service
async def get_guild_list_service(
    user_id: int, session: AsyncSession
) -> list[GuildDetailDTO]:
    guild_repo = GuildRepository(session)
    guilds = await guild_repo.get_list_by_user_id(user_id)
    return [GuildDetailDTO.model_validate(g) for g in guilds]


@http_service
async def get_guild_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> GuildDetailDTO:
    await verify_role(guild_id, user_id, session)

    guild_repo = GuildRepository(session)
    guild = await guild_repo.get_by_id(guild_id)
    if guild is None:
        raise HTTPError(GuildErrorCode.NotFound)

    return GuildDetailDTO.model_validate(guild)
