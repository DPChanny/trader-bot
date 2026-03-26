import httpx
from fastapi import HTTPException

from shared.utils.env import (
    get_app_origin,
    get_discord_client_id,
    get_discord_client_secret,
)


DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USER_URL = "https://discord.com/api/users/@me"


def get_redirect_uri() -> str:
    return f"{get_app_origin()}/auth/callback"


async def exchange_code(code: str) -> str:
    data = {
        "client_id": get_discord_client_id(),
        "client_secret": get_discord_client_secret(),
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": get_redirect_uri(),
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            DISCORD_TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Discord token exchange failed")
        return response.json()["access_token"]


async def get_user(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            DISCORD_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch Discord user")
        return response.json()
