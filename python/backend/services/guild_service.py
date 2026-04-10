from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild_dto import GuildDetailDTO
from shared.repositories.guild_repository import GuildRepository

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
async def get_guild_list_service(
    db: AsyncSession, payload: Payload
) -> list[GuildDetailDTO]:
    guild_repo = GuildRepository(db)
    guilds = await guild_repo.get_all_by_discord_user(payload.discord_id)
    return [GuildDetailDTO.model_validate(g) for g in guilds]


@service_exception_handler
async def get_guild_detail_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> GuildDetailDTO:
    await verify_role(guild_id, payload.discord_id, db)

    guild_repo = GuildRepository(db)
    guild = await guild_repo.get_by_id(guild_id)
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    return GuildDetailDTO.model_validate(guild)
