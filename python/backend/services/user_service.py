from typing import Any

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.user_dto import (
    AddUserDTO,
    UpdateUserDTO,
    UserDTO,
)
from shared.entities.user import User
from shared.exception import service_exception_handler

from ..utils.bot_client import get_profile_bytes as bot_get_profile_bytes
from ..utils.bucket import delete_profile, upload_profile


async def _upload_profile(bucket: Any, user_id: int, discord_id: str):
    profile_bytes = await bot_get_profile_bytes(discord_id)
    if not profile_bytes:
        logger.warning(f"Profile not found: user_id={user_id}, discord_id={discord_id}")
        raise HTTPException(status_code=502, detail="Profile not found")

    await upload_profile(bucket, user_id, profile_bytes)
    logger.info(f"Profile uploaded: user_id={user_id}")


@service_exception_handler
async def get_user_detail_service(user_id: int, db: Session) -> UserDTO:
    user = db.query(User).filter(User.user_id == user_id).first()

    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    return UserDTO.model_validate(user)


@service_exception_handler
async def add_user_service(dto: AddUserDTO, db: Session, bucket: Any) -> UserDTO:
    user = User(
        alias=dto.alias,
        riot_id=dto.riot_id,
        discord_id=dto.discord_id,
    )
    db.add(user)
    db.flush()

    if dto.discord_id is not None:
        await _upload_profile(bucket, user.user_id, dto.discord_id)

    db.commit()
    logger.info(f"User created: id={user.user_id}, alias={dto.alias}")

    db.refresh(user)
    return UserDTO.model_validate(user)


@service_exception_handler
async def get_user_list_service(db: Session) -> list[UserDTO]:
    users = db.query(User).all()
    return [UserDTO.model_validate(u) for u in users]


@service_exception_handler
async def update_user_service(
    user_id: int, dto: UpdateUserDTO, db: Session, bucket: Any
) -> UserDTO:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    old_discord_id = user.discord_id
    discord_id_changed = False

    for key, value in dto.model_dump(exclude_unset=True).items():
        if key == "discord_id" and value != old_discord_id:
            discord_id_changed = True
        setattr(user, key, value)

    db.flush()

    if discord_id_changed:
        await delete_profile(bucket, user.user_id)
        if user.discord_id is not None:
            await _upload_profile(bucket, user.user_id, user.discord_id)

    db.commit()
    logger.info(f"User updated: id={user_id}")

    db.refresh(user)
    return UserDTO.model_validate(user)


@service_exception_handler
async def update_profile_service(user_id: int, db: Session, bucket: Any) -> UserDTO:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    await delete_profile(bucket, user.user_id)
    if user.discord_id is not None:
        await _upload_profile(bucket, user.user_id, user.discord_id)

    logger.info(f"User profile updated: id={user_id}")
    db.refresh(user)
    return UserDTO.model_validate(user)


@service_exception_handler
async def delete_user_service(user_id: int, db: Session, bucket: Any) -> None:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.flush()

    await delete_profile(bucket, user_id)

    db.commit()
    logger.info(f"User deleted: id={user_id}")
