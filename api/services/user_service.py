import logging

from sqlalchemy.orm import Session

from dtos.base_dto import BaseResponseDTO
from dtos.user_dto import (
    AddUserRequestDTO,
    UpdateUserRequestDTO,
    GetUserDetailResponseDTO,
    GetUserListResponseDTO,
    UserDTO,
)
from entities.user import User
from .discord_service import discord_service
from utils.s3 import s3_client
from utils.exception import CustomException, handle_exception

logger = logging.getLogger(__name__)


async def update_discord_profile(user_id: int, discord_id: str) -> bool:
    try:
        await s3_client.delete_discord_profile(user_id)

        profile_url = await discord_service.fetch_discord_profile_url(
            discord_id
        )
        if not profile_url:
            return False

        import aiohttp

        async with aiohttp.ClientSession() as session:
            async with session.get(profile_url) as response:
                if response.status == 200:
                    image_data = await response.read()
                    await s3_client.upload_discord_profile(user_id, image_data)
                    logger.info(
                        f"Successfully uploaded discord profile for user: {user_id}"
                    )
                    return True
                else:
                    logger.warning(
                        f"Failed to download discord profile: {response.status}"
                    )
                    return False
    except Exception as e:
        logger.error(f"Failed to process discord profile: {e}")
        return False


async def get_user_detail_service(
    user_id: int, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()

        if not user:
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
    dto: AddUserRequestDTO, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = User(
            name=dto.name,
            riot_id=dto.riot_id,
            discord_id=dto.discord_id,
        )
        db.add(user)
        db.commit()

        logger.info(f"Added: {user.user_id}")

        if dto.discord_id:
            await update_discord_profile(user.user_id, dto.discord_id)

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
    user_id: int, dto: UpdateUserRequestDTO, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            logger.warning(f"Missing: {user_id}")
            raise CustomException(404, "User not found")

        old_discord_id = user.discord_id
        discord_id_changed = False

        for key, value in dto.model_dump(exclude_unset=True).items():
            if key == "discord_id" and value != old_discord_id:
                discord_id_changed = True
            setattr(user, key, value)

        db.commit()

        if discord_id_changed and user.discord_id:
            await update_discord_profile(user.user_id, user.discord_id)

        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


async def update_discord_profile_service(
    user_id: int, db: Session
) -> GetUserDetailResponseDTO | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found")

        if not user.discord_id:
            logger.warning(f"No discord_id for user: {user_id}")
            raise CustomException(400, "User has no discord_id")

        success = await update_discord_profile(user.user_id, user.discord_id)

        if not success:
            logger.warning(
                f"Failed to update discord profile for user: {user_id}"
            )
            raise CustomException(500, "Failed to update discord profile")

        logger.info(f"Discord profile updated: {user_id}")
        return await get_user_detail_service(user.user_id, db)

    except Exception as e:
        handle_exception(e, db)


async def delete_user_service(
    user_id: int, db: Session
) -> BaseResponseDTO[None] | None:
    try:
        user = db.query(User).filter(User.user_id == user_id).first()
        if not user:
            logger.warning(f"User missing: {user_id}")
            raise CustomException(404, "User not found")

        db.delete(user)
        db.commit()

        await s3_client.delete_discord_profile(user_id)

        logger.info(f"Deleted: {user_id}")

        return BaseResponseDTO(
            success=True,
            code=200,
            message="User deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
