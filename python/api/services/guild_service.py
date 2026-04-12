from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild_dto import GuildDTO
from shared.error import AppError, Guild
from shared.repositories.guild_repository import GuildRepository

from ..utils.exception import service_exception_handler
from ..utils.member import verify_role


@service_exception_handler
async def get_guild_list_service(user_id: int, session: AsyncSession) -> list[GuildDTO]:
    guild_repo = GuildRepository(session)
    guilds = await guild_repo.get_list_by_user_id(user_id)
    return [GuildDTO.model_validate(g) for g in guilds]


@service_exception_handler
async def get_guild_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> GuildDTO:
    await verify_role(guild_id, user_id, session)

    guild_repo = GuildRepository(session)
    guild = await guild_repo.get_by_id(guild_id)
    if guild is None:
        raise AppError(Guild.NotFound)

    return GuildDTO.model_validate(guild)
