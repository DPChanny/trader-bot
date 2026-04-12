from discord import User
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.error import service_error_handler
from shared.utils.logging import bind_target_func
from shared.utils.user import upsert_user


@service_error_handler
async def on_user_update_service(
    user: User,
    session: AsyncSession,
) -> None:
    log = bind_target_func(on_user_update_service)
    user_dto = await upsert_user(
        user.id,
        user.global_name or user.name,
        user.avatar.key if user.avatar else None,
        session,
    )
    log.bind(**user_dto.model_dump()).info("")
