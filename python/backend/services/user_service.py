from typing import Any

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.user_dto import (
    AddUserDTO,
    UpdateUserDTO,
    UserDTO,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.user import User
from shared.utils.exception import service_exception_handler

from ..utils.bot import get_profile
from ..utils.bucket import delete_profile, upload_profile
from ..utils.role import get_guild_ids, verify_role
from ..utils.token import Payload


async def _upload_profile(bucket: Any, user_id: int, discord_id: str):
    profile = await get_profile(discord_id)
    await upload_profile(bucket, user_id, profile)
    logger.info(f"Profile uploaded: user_id={user_id}")


@service_exception_handler
async def get_user_detail_service(
    user_id: int, db: Session, payload: Payload
) -> UserDTO:
    guild_ids = get_guild_ids(payload.manager_id, db)
    user = (
        db.query(User)
        .filter(User.user_id == user_id, User.guild_id.in_(guild_ids))
        .first()
    )

    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    return UserDTO.model_validate(user)


@service_exception_handler
async def add_user_service(
    dto: AddUserDTO, db: Session, bucket: Any, payload: Payload
) -> UserDTO:
    verify_role(dto.guild_id, payload.manager_id, GuildRole.EDITOR, db)

    user = User(
        guild_id=dto.guild_id,
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
async def get_user_list_service(db: Session, payload: Payload) -> list[UserDTO]:
    guild_ids = get_guild_ids(payload.manager_id, db)
    users = db.query(User).filter(User.guild_id.in_(guild_ids)).all()
    return [UserDTO.model_validate(u) for u in users]


@service_exception_handler
async def update_user_service(
    user_id: int, dto: UpdateUserDTO, db: Session, bucket: Any, payload: Payload
) -> UserDTO:
    guild_ids = get_guild_ids(payload.manager_id, db)
    user = (
        db.query(User)
        .filter(User.user_id == user_id, User.guild_id.in_(guild_ids))
        .first()
    )
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    verify_role(user.guild_id, payload.manager_id, GuildRole.EDITOR, db)

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
async def update_profile_service(
    user_id: int, db: Session, bucket: Any, payload: Payload
) -> UserDTO:
    guild_ids = get_guild_ids(payload.manager_id, db)
    user = (
        db.query(User)
        .filter(User.user_id == user_id, User.guild_id.in_(guild_ids))
        .first()
    )
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    verify_role(user.guild_id, payload.manager_id, GuildRole.EDITOR, db)

    await delete_profile(bucket, user.user_id)
    if user.discord_id is not None:
        await _upload_profile(bucket, user.user_id, user.discord_id)

    logger.info(f"User profile updated: id={user_id}")
    db.refresh(user)
    return UserDTO.model_validate(user)


@service_exception_handler
async def delete_user_service(
    user_id: int, db: Session, bucket: Any, payload: Payload
) -> None:
    guild_ids = get_guild_ids(payload.manager_id, db)
    user = (
        db.query(User)
        .filter(User.user_id == user_id, User.guild_id.in_(guild_ids))
        .first()
    )
    if user is None:
        logger.warning(f"User not found: id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")

    verify_role(user.guild_id, payload.manager_id, GuildRole.ADMIN, db)

    db.delete(user)
    db.flush()

    await delete_profile(bucket, user_id)

    db.commit()
    logger.info(f"User deleted: id={user_id}")
