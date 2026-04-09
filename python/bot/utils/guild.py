from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.guild import Guild


async def upsert_guild(
    guild_id: str, name: str, icon_hash: str | None, db: AsyncSession
) -> Guild:
    result = await db.execute(select(Guild).where(Guild.discord_id == guild_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Guild(
            discord_id=guild_id,
            name=name,
            icon_hash=icon_hash,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = name
        entity.icon_hash = icon_hash
        await db.flush()
    return entity


async def delete_guild(discord_guild_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is not None:
        await db.delete(entity)
        await db.flush()
