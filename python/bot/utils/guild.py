import discord
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.guild import Guild


def _icon_url(guild: discord.Guild) -> str | None:
    if not guild.icon:
        return None
    h = guild.icon.key
    ext = "gif" if h.startswith("a_") else "png"
    return f"https://cdn.discordapp.com/icons/{guild.id}/{h}.{ext}?size=256"


def get_icon_url(guild: discord.Guild) -> str | None:
    return _icon_url(guild)


async def upsert_guild(guild: discord.Guild, db: AsyncSession) -> Guild:
    discord_guild_id = str(guild.id)
    icon_url = _icon_url(guild)
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Guild(
            discord_id=discord_guild_id,
            name=guild.name,
            icon_url=icon_url,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = guild.name
        entity.icon_url = icon_url
        await db.flush()
    return entity


async def delete_guild(discord_guild_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is not None:
        await db.delete(entity)
        await db.flush()
