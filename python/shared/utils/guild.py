from sqlalchemy.ext.asyncio import AsyncSession

from ..dtos.guild import GuildDTO
from ..entities.guild import Guild
from ..repositories.guild_repository import GuildRepository


async def upsert_guild(
    guild_id: int, name: str, icon_hash: str | None, session: AsyncSession
) -> GuildDTO:
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
