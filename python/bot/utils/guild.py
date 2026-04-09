from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.guild import Guild


def get_icon_url(guild_id: str, icon_hash: str) -> str:
    ext = "gif" if icon_hash.startswith("a_") else "png"
    return f"https://cdn.discordapp.com/icons/{guild_id}/{icon_hash}.{ext}?size=256"


async def upsert_guild(
    guild_id: str, name: str, icon_hash: str | None, db: AsyncSession
) -> Guild:
    icon_url = get_icon_url(guild_id, icon_hash) if icon_hash else None
    result = await db.execute(select(Guild).where(Guild.discord_id == guild_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Guild(
            discord_id=guild_id,
            name=name,
            icon_url=icon_url,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = name
        entity.icon_url = icon_url
        await db.flush()
    return entity


async def delete_guild(discord_guild_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is not None:
        await db.delete(entity)
        await db.flush()
