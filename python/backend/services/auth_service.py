from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth_dto import RefreshDTO
from shared.entities.user import User
from shared.repositories.user_repository import UserRepository
from shared.utils.discord import (
    get_login_url,
    get_me,
    parse_oauth_state,
    upsert_discord_user,
)
from shared.utils.env import get_app_origin

from ..utils.exception import service_exception_handler
from ..utils.token import create_refresh_token, create_token, decode_token, hash_token


@service_exception_handler
async def login_service(next_path: str | None = None) -> RedirectResponse:
    return RedirectResponse(url=get_login_url(next_path))


@service_exception_handler
async def callback_service(
    code: str, state: str | None, session: AsyncSession
) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = int(user_data["id"])
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    await upsert_discord_user(discord_id, name, avatar_hash, session)

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(discord_id)
    if user is None:
        logger.info(f"User added: discord_id={discord_id}")
        user = User(discord_id=discord_id)
        user_repo.add(user)
        await user_repo.flush()
    else:
        logger.info(f"User login: discord_id={discord_id}")

    access_token = create_token(user.discord_id)
    refresh_token = create_refresh_token(user.discord_id)
    user.refresh_token = hash_token(refresh_token)
    await user_repo.commit()

    next_path = parse_oauth_state(state)
    if next_path:
        redirect_url = f"{get_app_origin()}{next_path}?token={access_token}&refresh_token={refresh_token}"
    else:
        redirect_url = (
            f"{get_app_origin()}/?token={access_token}&refresh_token={refresh_token}"
        )
    return RedirectResponse(url=redirect_url)


@service_exception_handler
async def refresh_token_service(dto: RefreshDTO, session: AsyncSession) -> dict:
    from fastapi import HTTPException

    discord_id = decode_token(dto.refresh_token)

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(discord_id)
    if user is None or user.refresh_token != hash_token(dto.refresh_token):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_token(user.discord_id)
    new_refresh_token = create_refresh_token(user.discord_id)
    user.refresh_token = hash_token(new_refresh_token)
    await user_repo.commit()

    logger.info(f"Token refreshed: discord_id={user.discord_id}")
    return {"token": access_token, "refresh_token": new_refresh_token}
