import discord
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.discord import Discord
from shared.entities.guild import Guild
from shared.entities.member import Member


def setup_intents() -> discord.Intents:
    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    return intents


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


async def upsert_guild(guild: discord.Guild, db: AsyncSession) -> Guild:
    discord_guild_id = str(guild.id)
    result = await db.execute(select(Guild).where(Guild.discord_id == discord_guild_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Guild(discord_id=discord_guild_id, name=guild.name)
        db.add(entity)
        await db.flush()
    return entity


async def upsert_member(guild_id: int, discord_id: str, db: AsyncSession) -> Member:
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Member(guild_id=guild_id, discord_id=discord_id)
        db.add(entity)
        await db.flush()
    return entity
