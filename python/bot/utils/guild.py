from discord import Guild as DiscordGuild
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild import GuildDTO
from shared.entities.guild import Guild
from shared.repositories.guild_repository import GuildRepository
from shared.utils.error import AppError, GuildErrorCode


async def upsert_guild(guild: DiscordGuild, session: AsyncSession) -> GuildDTO:
    guild_id = guild.id
    name = guild.name
    icon_hash = guild.icon.key if guild.icon else None
    repo = GuildRepository(session)
    entity = await repo.get_by_id(guild_id)
    if entity is None:
        entity = Guild(discord_id=guild_id, name=name, icon_hash=icon_hash)
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.icon_hash = icon_hash

    return GuildDTO.model_validate(entity)


async def delete_guild(guild_id: int, session: AsyncSession) -> GuildDTO:
    repo = GuildRepository(session)
    entity = await repo.get_by_id(guild_id)
    if entity is None:
        raise AppError(GuildErrorCode.NotFound)
    dto = GuildDTO.model_validate(entity)
    await session.delete(entity)
    return dto
