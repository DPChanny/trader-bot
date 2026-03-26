import secrets

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.token_dto import LoginDto, RefreshDto, TokenDto
from shared.entities.user import User
from shared.utils.exception import service_exception_handler

from ..utils.discord import exchange_code, get_user
from ..utils.token import create_token, hash_token


def _issue_tokens(user: User, db: Session) -> TokenDto:
    refresh_token = secrets.token_urlsafe(64)
    user.refresh_token = hash_token(refresh_token)
    db.commit()

    return TokenDto(
        token=create_token(user.user_id, user.discord_id),
        refresh_token=refresh_token,
    )


@service_exception_handler
async def get_token_service(dto: LoginDto, db: Session) -> TokenDto:
    access_token = await exchange_code(dto.code)
    user_data = await get_user(access_token)

    discord_id = str(user_data["id"])
    username = user_data.get("global_name") or user_data.get("username", "")

    manager = db.query(User).filter(User.discord_id == discord_id).first()
    if manager is None:
        logger.info(f"User added: discord_id={discord_id}, name={username}")
        manager = User(discord_id=discord_id, name=username)
        db.add(manager)
        db.flush()
    else:
        logger.info(f"User login: user_id={manager.user_id}, discord_id={discord_id}")

    return _issue_tokens(manager, db)


@service_exception_handler
def refresh_token_service(dto: RefreshDto, db: Session) -> TokenDto:
    manager = (
        db.query(User)
        .filter(User.refresh_token == hash_token(dto.refresh_token))
        .first()
    )
    if manager is None:
        logger.warning("Token refresh failed: reason=invalid_refresh_token")
        raise HTTPException(status_code=401, detail="Auth failed")

    logger.info(f"Token refreshed: user_id={manager.user_id}")
    return _issue_tokens(manager, db)
