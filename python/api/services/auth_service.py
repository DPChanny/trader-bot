import base64
import urllib.parse
from datetime import UTC, datetime

from fastapi import HTTPException
from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth_dto import ExchangeTokenDTO, RefreshTokenDTO, TokenDTO
from shared.entities.session import Session
from shared.entities.user import User
from shared.repositories.session_repository import SessionRepository
from shared.repositories.user_repository import UserRepository
from shared.utils.env import get_app_origin
from shared.utils.user import upsert_user

from ..utils.discord import get_login_url, get_me
from ..utils.exception import service_exception_handler
from ..utils.token import (
    consume_exchange_token,
    create_exchange_token,
    create_refresh_token,
    create_access_token,
    decode_refresh_token,
    hash_token,
)


@service_exception_handler
async def login_service(redirect: str | None = None) -> RedirectResponse:
    state = base64.urlsafe_b64encode(redirect.encode()).decode() if redirect else None
    return RedirectResponse(url=get_login_url(state))


@service_exception_handler
async def callback_service(
    code: str, state: str | None, session: AsyncSession
) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = int(user_data["id"])
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    await upsert_user(discord_id, name, avatar_hash, session)

    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(discord_id)
    if user is None:
        logger.info(f"User added: discord_id={discord_id}")
        user = User(discord_id=discord_id, name=name, avatar_hash=avatar_hash)
        user_repo.add(user)
        await user_repo.flush()
    else:
        logger.info(f"User login: discord_id={discord_id}")

    access_token = create_access_token(user.discord_id)
    refresh_token, jti, expiration = create_refresh_token(user.discord_id)
    session_repo = SessionRepository(session)
    session_repo.add(
        Session(
            jti=jti,
            user_id=user.discord_id,
            token_hash=hash_token(refresh_token),
            expires_at=datetime.fromtimestamp(expiration, tz=UTC),
        )
    )
    await user_repo.commit()

    exchange_token = create_exchange_token(access_token, refresh_token)
    redirect = base64.urlsafe_b64decode(state.encode()).decode() if state else None
    params = {
        "exchangeToken": exchange_token,
    }
    if redirect:
        params["redirect"] = redirect

    redirect_url = (
        f"{get_app_origin()}/auth/login/callback?{urllib.parse.urlencode(params)}"
    )
    return RedirectResponse(url=redirect_url)


@service_exception_handler
async def exchange_token_service(dto: ExchangeTokenDTO) -> TokenDTO:
    token_pair = consume_exchange_token(dto.exchange_token)
    if token_pair is None:
        raise HTTPException(status_code=401, detail="Invalid exchange token")

    token, refresh_token = token_pair
    return TokenDTO(token=token, refresh_token=refresh_token)


@service_exception_handler
async def refresh_token_service(
    dto: RefreshTokenDTO, session: AsyncSession
) -> TokenDTO:
    discord_id, jti = decode_refresh_token(dto.refresh_token)

    session_repo = SessionRepository(session)
    session_entity = await session_repo.get_by_jti(jti)

    if (
        session_entity is None
        or session_entity.token_hash != hash_token(dto.refresh_token)
        or session_entity.revoked_at is not None
        or session_entity.expires_at < datetime.now(UTC)
    ):
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    session_entity.revoked_at = datetime.now(UTC)

    access_token = create_access_token(discord_id)
    new_refresh_token, new_jti, expiration = create_refresh_token(discord_id)
    session_repo.add(
        Session(
            jti=new_jti,
            user_id=discord_id,
            token_hash=hash_token(new_refresh_token),
            expires_at=datetime.fromtimestamp(expiration, tz=UTC),
        )
    )
    await session_repo.commit()

    logger.info(f"Token refreshed: discord_id={discord_id}")
    return TokenDTO(token=access_token, refresh_token=new_refresh_token)


@service_exception_handler
async def logout_service(dto: RefreshTokenDTO, session: AsyncSession) -> None:
    discord_id, jti = decode_refresh_token(dto.refresh_token)

    session_repo = SessionRepository(session)
    session_entity = await session_repo.get_by_jti(jti)
    if session_entity is None:
        raise HTTPException(status_code=404, detail="Session not found")

    session_entity.revoked_at = datetime.now(UTC)
    await session_repo.commit()
    logger.info(f"User logged out: discord_id={discord_id}, jti={jti}")


@service_exception_handler
async def logout_all_service(user_id: int, session: AsyncSession) -> None:
    await session.execute(
        update(Session)
        .where(Session.user_id == user_id, Session.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )
    await session.commit()
    logger.info(f"User logged out from all sessions: discord_id={user_id}")
