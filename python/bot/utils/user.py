from discord import User as DiscordUser
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDTO
from shared.utils.user import upsert_user


async def sync_user(user: DiscordUser, session: AsyncSession) -> UserDTO:
    return await upsert_user(
        user.id,
        user.global_name or user.name,
        user.avatar.key if user.avatar else None,
        session,
    )
