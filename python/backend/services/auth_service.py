from urllib.parse import quote

import httpx
from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.entities.manager import Manager
from shared.utils.env import (
    get_discord_client_id,
    get_discord_client_secret,
    get_discord_redirect_uri,
)

from ..utils.jwt import create_jwt_token, refresh_jwt_token


DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USER_URL = "https://discord.com/api/users/@me"


def get_discord_login_url() -> str:
    client_id = get_discord_client_id()
    redirect_uri = get_discord_redirect_uri()
    return (
        f"{DISCORD_OAUTH_URL}"
        f"?client_id={client_id}"
        f"&redirect_uri={quote(redirect_uri)}"
        f"&response_type=code"
        f"&scope=identify"
    )


async def exchange_code(code: str) -> str:
    data = {
        "client_id": get_discord_client_id(),
        "client_secret": get_discord_client_secret(),
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": get_discord_redirect_uri(),
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            DISCORD_TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code != 200:
            logger.error(
                f"Discord token exchange failed: status={response.status_code}"
            )
            raise HTTPException(status_code=401, detail="Discord token exchange failed")
        return response.json()["access_token"]


async def get_discord_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            DISCORD_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.status_code != 200:
            logger.error(f"Discord user fetch failed: status={response.status_code}")
            raise HTTPException(status_code=401, detail="Failed to fetch Discord user")
        return response.json()


def login_or_register(discord_id: str, username: str, db: Session) -> Manager:
    manager = db.query(Manager).filter(Manager.discord_id == discord_id).first()
    if not manager:
        logger.info(
            f"Registering new manager: discord_id={discord_id}, name={username}"
        )
        manager = Manager(discord_id=discord_id, name=username)
        db.add(manager)
        db.commit()
        db.refresh(manager)
    else:
        logger.info(
            f"Manager logged in: manager_id={manager.manager_id}, discord_id={discord_id}"
        )
    return manager


def create_manager_jwt(manager: Manager) -> str:
    payload = {
        "manager_id": manager.manager_id,
        "discord_id": manager.discord_id,
        "role": "manager",
    }
    return create_jwt_token(payload)


def refresh_manager_jwt(token: str) -> str:
    return refresh_jwt_token(token)
