import discord
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.discord import Discord


async def upsert_discord(
    user: discord.User | discord.Member, db: AsyncSession
) -> Discord:
    discord_id = str(user.id)
    result = await db.execute(select(Discord).where(Discord.discord_id == discord_id))
    entity = result.scalar_one_or_none()
    name = user.global_name or user.name
    avatar_hash = user.avatar.key if user.avatar else None
    if entity is None:
        entity = Discord(discord_id=discord_id, name=name, avatar_hash=avatar_hash)
        db.add(entity)
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
    await db.flush()
    return entity
