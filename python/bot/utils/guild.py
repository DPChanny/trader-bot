from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.guild import Guild


async def upsert_guild(
    guild_id: int, name: str, icon_hash: str | None, session: AsyncSession
) -> Guild:
    result = await session.execute(select(Guild).where(Guild.discord_id == guild_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Guild(
            discord_id=guild_id,
            name=name,
            icon_hash=icon_hash,
        )
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.icon_hash = icon_hash
        await session.flush()
    return entity


async def delete_guild(discord_guild_id: int, session: AsyncSession) -> None:
    result = await session.execute(
        select(Guild).where(Guild.discord_id == discord_guild_id)
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        await session.delete(entity)
        await session.flush()
