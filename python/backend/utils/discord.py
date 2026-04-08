import urllib.parse

import httpx
from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.discord import Discord
from shared.utils.env import (
    get_api_origin,
    get_bot_token,
    get_discord_client_id,
    get_discord_client_secret,
)


DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USERS_URL = "https://discord.com/api/users"
DISCORD_GUILDS_URL = "https://discord.com/api/guilds"
DISCORD_CHANNELS_URL = "https://discord.com/api/channels"


def _get_api_endpoint() -> str:
    return f"{get_api_origin()}/api"


def _get_login_callback_url() -> str:
    return f"{_get_api_endpoint()}/auth/login/callback"


def get_login_url() -> str:
    params = urllib.parse.urlencode(
        {
            "client_id": get_discord_client_id(),
            "scope": "identify",
            "response_type": "code",
            "redirect_uri": _get_login_callback_url(),
        }
    )
    return f"{DISCORD_OAUTH_URL}?{params}"


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


async def get_guild(guild_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{DISCORD_GUILDS_URL}/{guild_id}",
            headers={"Authorization": f"Bot {get_bot_token()}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Discord guild")
        return response.json()


async def get_user(user_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{DISCORD_USERS_URL}/{user_id}",
            headers={"Authorization": f"Bot {get_bot_token()}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Discord user")
        return response.json()


async def verify_member(guild_id: str, user_id: str) -> None:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{DISCORD_GUILDS_URL}/{guild_id}/members/{user_id}",
            headers={"Authorization": f"Bot {get_bot_token()}"},
        )
        if response.status_code == 404:
            raise HTTPException(
                status_code=400, detail="Discord user is not a member of this guild"
            )
        if response.status_code != 200:
            raise HTTPException(
                status_code=400, detail="Failed to verify Discord guild membership"
            )


async def upsert_discord_from_api(discord_id: str, db: AsyncSession) -> Discord:
    result = await db.execute(select(Discord).where(Discord.discord_id == discord_id))
    existing = result.scalar_one_or_none()
    if existing is not None:
        return existing

    user_data = await get_user(discord_id)
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    discord_entity = Discord(discord_id=discord_id, name=name, avatar_hash=avatar_hash)
    db.add(discord_entity)
    await db.flush()
    return discord_entity


async def send_message(user_id: str, embeds: list[dict]) -> bool:
    headers = {
        "Authorization": f"Bot {get_bot_token()}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        ch_response = await client.post(
            f"{DISCORD_USERS_URL}/@me/channels",
            headers=headers,
            json={"recipient_id": user_id},
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
