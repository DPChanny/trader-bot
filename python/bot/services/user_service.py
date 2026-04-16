from discord import User
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import bot_service

from ..utils.user import sync_user


@bot_service
async def on_user_update_service(
    user: User,
    session: AsyncSession,
    event,
) -> None:
    user_dto = await sync_user(user, session)
    event |= user_dto.model_dump()
