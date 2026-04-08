import discord
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.guild import Guild


async def upsert_guild(guild: discord.Guild, db: AsyncSession) -> Guild:
    discord_guild_id = str(guild.id)
    owner_discord_id = str(guild.owner_id)
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Guild(
            discord_id=discord_guild_id,
            name=guild.name,
            owner_discord_id=owner_discord_id,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = guild.name
        entity.owner_discord_id = owner_discord_id
        await db.flush()
    return entity
