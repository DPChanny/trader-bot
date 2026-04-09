from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.token_dto import RefreshDTO
from shared.entities.discord import Discord
from shared.entities.user import User
from shared.utils.discord import get_avatar_url, get_login_url, get_me
from shared.utils.env import get_app_origin

from ..utils.exception import service_exception_handler
from ..utils.token import create_refresh_token, create_token, decode_token, hash_token


@service_exception_handler
async def login_service() -> RedirectResponse:
    return RedirectResponse(url=get_login_url())


@service_exception_handler
async def callback_service(code: str, db: AsyncSession) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = str(user_data["id"])
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_url = get_avatar_url(discord_id, user_data.get("avatar"))

    result = await db.execute(select(Discord).where(Discord.discord_id == discord_id))
    discord_entity = result.scalar_one_or_none()
    if discord_entity is None:
        discord_entity = Discord(
            discord_id=discord_id, name=name, avatar_url=avatar_url
        )
        db.add(discord_entity)
        await db.flush()
    else:
        discord_entity.name = name
        discord_entity.avatar_url = avatar_url

    result = await db.execute(select(User).where(User.discord_id == discord_id))
    user = result.scalar_one_or_none()
    if user is None:
        logger.info(f"User added: discord_id={discord_id}")
        user = User(discord_id=discord_id)
        db.add(user)
        await db.flush()
    else:
        logger.info(f"User login: user_id={user.user_id}, discord_id={discord_id}")

    access_token = create_token(user.user_id, user.discord_id)
    refresh_token = create_refresh_token(user.user_id, user.discord_id)
    user.refresh_token = hash_token(refresh_token)
    await db.commit()

    redirect_url = (
        f"{get_app_origin()}/?token={access_token}&refresh_token={refresh_token}"
    )
    return RedirectResponse(url=redirect_url)


@service_exception_handler
async def refresh_token_service(dto: RefreshDTO, db: AsyncSession) -> dict:
    from fastapi import HTTPException

    payload = decode_token(dto.refresh_token)

    result = await db.execute(select(User).where(User.user_id == payload.user_id))
    user = result.scalar_one_or_none()
    if user is None or user.refresh_token != hash_token(dto.refresh_token):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    access_token = create_token(user.user_id, user.discord_id)
    new_refresh_token = create_refresh_token(user.user_id, user.discord_id)
    user.refresh_token = hash_token(new_refresh_token)
    await db.commit()

    logger.info(f"Token refreshed: user_id={user.user_id}")
    return {"token": access_token, "refresh_token": new_refresh_token}
