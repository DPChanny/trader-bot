from discord import User
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDTO
from shared.utils.service import Event, bot_service, set_event_response

from ..utils.user import sync_user


@bot_service
async def on_user_update_service(
    user: User,
    session: AsyncSession,
    event: Event,
) -> UserDTO:
    response = await sync_user(user, session)
    return set_event_response(event, response)
