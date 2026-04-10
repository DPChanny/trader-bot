import base64
import urllib.parse

import httpx
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.discord_user import DiscordUser
from ..repositories.discord_user_repository import DiscordUserRepository
from .env import (
    get_api_origin,
    get_bot_token,
    get_discord_client_id,
    get_discord_client_secret,
)


DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USERS_URL = "https://discord.com/api/users"
DISCORD_CHANNELS_URL = "https://discord.com/api/channels"


def _get_api_endpoint() -> str:
    return f"{get_api_origin()}/api"


def _get_login_callback_url() -> str:
    return f"{_get_api_endpoint()}/auth/login/callback"


def get_login_url(next_path: str | None = None) -> str:
    params: dict = {
        "client_id": get_discord_client_id(),
        "scope": "identify",
        "response_type": "code",
        "redirect_uri": _get_login_callback_url(),
    }
    if next_path:
        params["state"] = base64.urlsafe_b64encode(next_path.encode()).decode()
    return f"{DISCORD_OAUTH_URL}?{urllib.parse.urlencode(params)}"


def parse_oauth_state(state: str | None) -> str | None:
    if not state:
        return None
    try:
        return base64.urlsafe_b64decode(state.encode()).decode()
    except Exception:
        return None


async def get_me(code: str) -> dict:
    data = {
        "client_id": get_discord_client_id(),
        "client_secret": get_discord_client_secret(),
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": _get_login_callback_url(),
    }
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            DISCORD_TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if token_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Discord token exchange failed")
        access_token = token_response.json()["access_token"]

        me_response = await client.get(
            f"{DISCORD_USERS_URL}/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if me_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch Discord user")
        return me_response.json()


async def send_message(user_id: int, embeds: list[dict]) -> bool:
    headers = {
        "Authorization": f"Bot {get_bot_token()}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        ch_response = await client.post(
            f"{DISCORD_USERS_URL}/@me/channels",
            headers=headers,
            json={"recipient_id": str(user_id)},
        )
        if ch_response.status_code != 200:
            return False

        channel_id = ch_response.json()["id"]
        msg_response = await client.post(
            f"{DISCORD_CHANNELS_URL}/{channel_id}/messages",
            headers=headers,
            json={"embeds": embeds},
        )
        return msg_response.status_code == 200


async def upsert_discord_user(
    discord_id: int,
    name: str,
    avatar_hash: str | None,
    session: AsyncSession,
) -> None:
    repo = DiscordUserRepository(session)
    entity = await repo.get_by_id(discord_id)
    if entity is None:
        repo.add(DiscordUser(discord_id=discord_id, name=name, avatar_hash=avatar_hash))
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
