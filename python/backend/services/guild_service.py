from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDetailDTO, GuildDTO
from shared.repositories.guild_repository import GuildRepository
from shared.utils.error import GuildErrorCode, HTTPError
from shared.utils.service import Event, http_service

from ..utils.member import verify_role


@http_service
async def get_guilds_service(
    user_id: int, session: AsyncSession, event: Event
) -> list[GuildDetailDTO]:
    guild_repo = GuildRepository(session)
    guilds = await guild_repo.get_all_by_user_id(user_id)

    response: list[GuildDetailDTO] = []
    event.response = []
    for guild in guilds:
        response.append(GuildDetailDTO.model_validate(guild))
        event.response.append(GuildDTO.model_validate(guild))

    return response


@http_service
async def get_guild_service(
    guild_id: int, user_id: int, session: AsyncSession, event: Event
) -> GuildDetailDTO:
    await verify_role(guild_id, user_id, session)

    guild_repo = GuildRepository(session)
    guild = await guild_repo.get_by_id(guild_id)
    if guild is None:
        raise HTTPError(GuildErrorCode.NotFound)

    event.response = GuildDTO.model_validate(guild)
    return GuildDetailDTO.model_validate(guild)
