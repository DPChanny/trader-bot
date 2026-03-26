from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.token_dto import LoginDto, TokenDto
from shared.entities.manager import Manager
from shared.utils.exception import service_exception_handler

from ..utils.discord import exchange_code, get_user
from ..utils.token import create_token


@service_exception_handler
async def get_token_service(dto: LoginDto, db: Session) -> TokenDto:
    access_token = await exchange_code(dto.code)
    user_data = await get_user(access_token)

    discord_id = str(user_data["id"])
    username = user_data.get("global_name") or user_data.get("username", "")

    manager = db.query(Manager).filter(Manager.discord_id == discord_id).first()
    if not manager:
        logger.info(f"New manager: discord_id={discord_id}, name={username}")
        manager = Manager(discord_id=discord_id, name=username)
        db.add(manager)
        db.commit()
        db.refresh(manager)
    else:
        logger.info(
            f"Manager login: manager_id={manager.manager_id}, discord_id={discord_id}"
        )

    payload = {
        "manager_id": manager.manager_id,
        "discord_id": manager.discord_id,
        "role": "manager",
    }
    return TokenDto(token=create_token(payload))


@service_exception_handler
def refresh_token_service(payload: dict) -> TokenDto:
    payload = {k: v for k, v in payload.items() if k not in ("exp", "iat")}
    return TokenDto(token=create_token(payload))
