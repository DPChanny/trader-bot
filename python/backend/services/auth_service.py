from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.discord import Discord
from shared.entities.user import User
from shared.utils.env import get_app_origin
from ..utils.exception import service_exception_handler

from ..utils.discord import get_login_url, get_me
from ..utils.token import Payload, create_token


@service_exception_handler
async def login_service() -> RedirectResponse:
    return RedirectResponse(url=get_login_url())


@service_exception_handler
async def callback_service(code: str, db: AsyncSession) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = str(user_data["id"])
    username = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    result = await db.execute(select(Discord).where(Discord.discord_id == discord_id))
    discord = result.scalar_one_or_none()
    if discord is None:
        logger.info(f"Discord added: discord_id={discord_id}")
        discord = Discord(discord_id=discord_id, name=username, avatar_hash=avatar_hash)
        db.add(discord)
    else:
        discord.name = username
        discord.avatar_hash = avatar_hash
    await db.flush()

    result = await db.execute(select(User).where(User.discord_id == discord_id))
    user = result.scalar_one_or_none()
    if user is None:
        logger.info(f"User added: discord_id={discord_id}")
        user = User(discord_id=discord_id)
        db.add(user)
        await db.flush()
    else:
        logger.info(f"User login: user_id={user.user_id}, discord_id={discord_id}")

    token = create_token(user.user_id, user.discord_id)
    await db.commit()

    redirect_url = f"{get_app_origin()}/?token={token}"
    return RedirectResponse(url=redirect_url)


@service_exception_handler
async def refresh_token_service(payload: Payload) -> dict:
    token = create_token(payload.user_id, payload.discord_id)
    logger.info(f"Token refreshed: user_id={payload.user_id}")
    return {"token": token}
