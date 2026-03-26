import secrets

from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.token_dto import LoginDto, RefreshDto, TokenDto
from shared.entities.user import User
from shared.utils.exception import service_exception_handler

from ..utils.discord import exchange_code, get_user
from ..utils.token import create_token, hash_token


async def _issue_tokens(user: User, db: AsyncSession) -> TokenDto:
    refresh_token = secrets.token_urlsafe(64)
    user.refresh_token = hash_token(refresh_token)
    await db.commit()

    return TokenDto(
        token=create_token(user.user_id, user.discord_id),
        refresh_token=refresh_token,
    )


@service_exception_handler
async def get_token_service(dto: LoginDto, db: AsyncSession) -> TokenDto:
    access_token = await exchange_code(dto.code)
    user_data = await get_user(access_token)

    discord_id = str(user_data["id"])
    username = user_data.get("global_name") or user_data.get("username", "")

    result = await db.execute(select(User).where(User.discord_id == discord_id))
    manager = result.scalar_one_or_none()
    if manager is None:
        logger.info(f"User added: discord_id={discord_id}, name={username}")
        manager = User(discord_id=discord_id, name=username)
        db.add(manager)
        await db.flush()
    else:
        logger.info(f"User login: user_id={manager.user_id}, discord_id={discord_id}")

    return await _issue_tokens(manager, db)


@service_exception_handler
async def refresh_token_service(dto: RefreshDto, db: AsyncSession) -> TokenDto:
    result = await db.execute(
        select(User).where(User.refresh_token == hash_token(dto.refresh_token))
    )
    manager = result.scalar_one_or_none()
    if manager is None:
        raise HTTPException(status_code=401, detail="Auth failed")

    logger.info(f"Token refreshed: user_id={manager.user_id}")
    return await _issue_tokens(manager, db)
