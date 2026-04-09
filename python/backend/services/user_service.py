from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from shared.dtos.user_dto import UserDetailDTO
from shared.entities.user import User

from ..utils.exception import service_exception_handler
from ..utils.token import Payload


@service_exception_handler
async def get_me_service(db: AsyncSession, payload: Payload) -> UserDetailDTO:
    result = await db.execute(
        select(User)
        .options(selectinload(User.discord_user))
        .where(User.discord_id == payload.discord_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDetailDTO.model_validate(user)


@service_exception_handler
async def delete_me_service(db: AsyncSession, payload: Payload) -> None:
    result = await db.execute(select(User).where(User.discord_id == payload.discord_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    logger.info(f"User deleted: discord_id={payload.discord_id}")
