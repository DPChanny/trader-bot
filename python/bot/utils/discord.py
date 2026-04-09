import discord
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.user import User


async def upsert_user_profile(
    user: discord.User | discord.Member, db: AsyncSession
) -> None:
    discord_id = str(user.id)
    result = await db.execute(select(User).where(User.discord_id == discord_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        return
    entity.name = user.global_name or user.name
    entity.avatar_hash = user.avatar.key if user.avatar else None
    await db.flush()
