from discord import User
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import Event, bot_service

from ..utils.user import sync_user


@bot_service
async def on_user_update_service(
    user: User, session: AsyncSession, event: Event
) -> None:
    event.result = await sync_user(user, session)
