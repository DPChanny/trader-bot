from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild_dto import GuildDetailDTO
from shared.repositories.guild_repository import GuildRepository

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import TokenPayload


@service_exception_handler
async def get_guild_list_service(
    session: AsyncSession, token_payload: TokenPayload
) -> list[GuildDetailDTO]:
    guild_repo = GuildRepository(session)
    guilds = await guild_repo.get_all_by_discord_user(token_payload.discord_id)
    return [GuildDetailDTO.model_validate(g) for g in guilds]


@service_exception_handler
async def get_guild_detail_service(
    guild_id: int, session: AsyncSession, token_payload: TokenPayload
) -> GuildDetailDTO:
    await verify_role(guild_id, token_payload.discord_id, session)

    guild_repo = GuildRepository(session)
    guild = await guild_repo.get_by_id(guild_id)
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    return GuildDetailDTO.model_validate(guild)
