from typing import Any

import aiohttp
from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.user_dto import (
    AddUserRequestDTO,
    UpdateUserRequestDTO,
    UserDTO,
)
from shared.entities.user import User

from ..utils.bucket import delete_profile, upload_profile
from ..utils.exception import service_exception_handler
from .discord_service import discord_service


async def _sync_profile(bucket: Any, user_id: int, discord_id: str):
    try:
        await delete_profile(bucket, user_id)

        profile_url = await discord_service.fetch_profile_url(discord_id)
        if not profile_url:
            return

        async with (
            aiohttp.ClientSession() as session,
            session.get(profile_url) as response,
        ):
            if response.status == 200:
                image_data = await response.read()
                await upload_profile(bucket, user_id, image_data)
                logger.info(f"Profile synced: user_id={user_id}")
            else:
                logger.warning(
                    f"Profile download failed: user_id={user_id}, status={response.status}"
                )
    except Exception as e:
        logger.exception(f"Profile sync error: user_id={user_id}")


@service_exception_handler
async def get_user_detail_service(user_id: int, db: Session) -> UserDTO:
    user = db.query(User).filter(User.user_id == user_id).first()

    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found.")

    return UserDTO.model_validate(user)


@service_exception_handler
async def add_user_service(dto: AddUserRequestDTO, db: Session, bucket: Any) -> UserDTO:
    user = User(
        alias=dto.alias,
        riot_id=dto.riot_id,
        discord_id=dto.discord_id,
    )
    db.add(user)
    db.commit()

    logger.info(f"User created: id={user.user_id}, alias={dto.alias}")

    if dto.discord_id is not None:
        await _sync_profile(bucket, user.user_id, dto.discord_id)

    return await get_user_detail_service(user.user_id, db)


@service_exception_handler
async def get_user_list_service(db: Session) -> list[UserDTO]:
    users = db.query(User).all()
    return [UserDTO.model_validate(u) for u in users]


@service_exception_handler
async def update_user_service(
    user_id: int, dto: UpdateUserRequestDTO, db: Session, bucket: Any
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

    db.commit()
    logger.info(f"User updated: id={user_id}")

    if discord_id_changed and user.discord_id is not None:
        await _sync_profile(bucket, user.user_id, user.discord_id)

    return await get_user_detail_service(user.user_id, db)


@service_exception_handler
async def update_profile_service(user_id: int, db: Session, bucket: Any) -> UserDTO:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    if user.discord_id is not None:
        await _sync_profile(bucket, user.user_id, user.discord_id)

    logger.info(f"User profile updated: id={user_id}")
    return await get_user_detail_service(user.user_id, db)


@service_exception_handler
async def delete_user_service(user_id: int, db: Session, bucket: Any) -> None:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    await delete_profile(bucket, user_id)

    logger.info(f"User deleted: id={user_id}")
