from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.user import User
from shared.utils.env import get_app_origin
from shared.utils.exception import service_exception_handler

from ..utils.discord import exchange_code, get_login_url, get_me
from ..utils.token import Payload, create_token


@service_exception_handler
async def login_service() -> RedirectResponse:
    return RedirectResponse(url=get_login_url())


@service_exception_handler
async def callback_service(code: str, db: AsyncSession) -> RedirectResponse:
    access_token = await exchange_code(code)
    user_data = await get_me(access_token)

    discord_id = str(user_data["id"])
    username = user_data.get("global_name") or user_data.get("username", "")

    result = await db.execute(select(User).where(User.discord_id == discord_id))
    user = result.scalar_one_or_none()
    if user is None:
        logger.info(f"User added: discord_id={discord_id}, name={username}")
        user = User(discord_id=discord_id, name=username)
        db.add(user)
        await db.flush()
    else:
        logger.info(f"User login: user_id={user.user_id}, discord_id={discord_id}")

    token = create_token(user.user_id, user.discord_id)
    await db.commit()

    redirect_url = f"{get_app_origin()}/auth/callback?token={token}"
    return RedirectResponse(url=redirect_url)


@service_exception_handler
async def refresh_token_service(payload: Payload) -> dict:
    token = create_token(payload.user_id, payload.discord_id)
    logger.info(f"Token refreshed: user_id={payload.user_id}")
    return {"token": token}
