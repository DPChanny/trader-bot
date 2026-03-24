import logging
from typing import Any

import aiohttp
from sqlalchemy.orm import Session

from shared.dtos.base_dto import BaseResponseDTO
from shared.dtos.user_dto import (
    AddUserRequestDTO,
    GetUserDetailResponseDTO,
    GetUserListResponseDTO,
    UpdateUserRequestDTO,
    UserDTO,
)
from shared.entities.user import User

from ..utils.bucket import delete_profile, upload_profile
from ..utils.exception import CustomException, handle_exception
from .discord_service import discord_service


logger = logging.getLogger(__name__)


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
                logger.info(f"Profile synced: {user_id}")
            else:
                logger.warning(f"Failed to download profile: {response.status}")
    except Exception as e:
        logger.error(f"Failed to sync profile: {e}")


async def get_user_detail_service(
    user_id: int, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()

        if user is None:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found.")

        user_dto = UserDTO.model_validate(user)

        return GetUserDetailResponseDTO(
            success=True,
            code=200,
            message="User detail retrieved successfully.",
            data=user_dto,
        )

    except Exception as e:
        handle_exception(e, db)


async def add_user_service(
    dto: AddUserRequestDTO, db: Session, bucket: Any
) -> GetUserDetailResponseDTO | None:
    try:
        user = User(
            alias=dto.alias,
            riot_id=dto.riot_id,
            discord_id=dto.discord_id,
        )
        db.add(user)
        db.commit()

        logger.info(f"Added: {user.user_id}")

        if dto.discord_id is not None:
            await _sync_profile(bucket, user.user_id, dto.discord_id)

        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


async def get_user_list_service(db: Session) -> GetUserListResponseDTO | None:
    try:
        users = db.query(User).all()

        user_dtos = [UserDTO.model_validate(u) for u in users]

        return GetUserListResponseDTO(
            success=True,
            code=200,
            message="User list retrieved successfully.",
            data=user_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


async def update_user_service(
    user_id: int, dto: UpdateUserRequestDTO, db: Session, bucket: Any
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if user is None:
            logger.warning(f"Missing: {user_id}")
            raise CustomException(404, "User not found")

        old_discord_id = user.discord_id
        discord_id_changed = False

        for key, value in dto.model_dump(exclude_unset=True).items():
            if key == "discord_id" and value != old_discord_id:
                discord_id_changed = True
            setattr(user, key, value)

        db.commit()

        if discord_id_changed and user.discord_id is not None:
            await _sync_profile(bucket, user.user_id, user.discord_id)

        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


async def update_profile_service(
    user_id: int, db: Session, bucket: Any
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if user is None:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found")

        if user.discord_id is not None:
            await _sync_profile(bucket, user.user_id, user.discord_id)

        logger.info(f"Discord profile updated: {user_id}")
        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


async def delete_user_service(
    user_id: int, db: Session, bucket: Any
) -> BaseResponseDTO[None] | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if user is None:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found")

        db.delete(user)
        db.commit()

        await delete_profile(bucket, user_id)

        logger.info(f"Deleted: {user_id}")

        return BaseResponseDTO(
            success=True,
            code=200,
            message="User deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
