from discord import User
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import bot_service
from shared.utils.user import upsert_user


@bot_service
async def on_user_update_service(
    user: User,
    session: AsyncSession,
    event,
) -> None:
    user_dto = await upsert_user(
        user.id,
        user.global_name or user.name,
        user.avatar.key if user.avatar else None,
        session,
    )
    event |= user_dto.model_dump()
