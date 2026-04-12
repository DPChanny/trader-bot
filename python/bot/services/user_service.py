from discord import User
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import service
from shared.utils.user import upsert_user


@service
async def on_user_update_service(
    user: User,
    session: AsyncSession,
    logger,
) -> None:
    user_dto = await upsert_user(
        user.id,
        user.global_name or user.name,
        user.avatar.key if user.avatar else None,
        session,
    )
    logger.bind(**user_dto.model_dump())
