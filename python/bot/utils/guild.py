import discord
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.guild import Guild


async def upsert_guild(guild: discord.Guild, db: AsyncSession) -> Guild:
    discord_guild_id = str(guild.id)
    icon_hash = guild.icon.key if guild.icon else None
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Guild(
            discord_id=discord_guild_id,
            name=guild.name,
            icon_hash=icon_hash,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = guild.name
        entity.icon_hash = icon_hash
        await db.flush()
    return entity


async def delete_guild(discord_guild_id: str, db: AsyncSession) -> None:
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is not None:
        await db.delete(entity)
        await db.flush()
