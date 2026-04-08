from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user_dto import UserDTO
from shared.entities.user import User
from ..utils.exception import service_exception_handler

from ..utils.token import Payload


@service_exception_handler
async def get_user_by_discord_id_service(
    discord_id: str, db: AsyncSession, payload: Payload
) -> UserDTO:
    result = await db.execute(select(User).where(User.discord_id == discord_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDTO.model_validate(user)


@service_exception_handler
async def get_me_service(db: AsyncSession, payload: Payload) -> UserDTO:
    result = await db.execute(select(User).where(User.user_id == payload.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDTO.model_validate(user)


@service_exception_handler
async def delete_me_service(db: AsyncSession, payload: Payload) -> None:
    result = await db.execute(select(User).where(User.user_id == payload.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await db.delete(user)
    await db.commit()
    logger.info(f"User deleted: user_id={payload.user_id}")
