from discord import User
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDTO
from shared.utils.service import bot_service

from ..utils.user import sync_user


@bot_service
async def on_user_update_service(user: User, session: AsyncSession) -> UserDTO:
    return await sync_user(user, session)
