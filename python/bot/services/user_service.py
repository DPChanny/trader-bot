from discord import User
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import bot_service
from shared.utils.user import upsert_user


async def sync_user_service(user: User, session: AsyncSession) -> dict:
    user_dto = await upsert_user(
        user.id,
        user.global_name or user.name,
        user.avatar.key if user.avatar else None,
        session,
    )
    return user_dto.model_dump()


@bot_service
async def on_user_update_service(
    user: User,
    session: AsyncSession,
    event,
) -> None:
    event |= await sync_user_service(user, session)
