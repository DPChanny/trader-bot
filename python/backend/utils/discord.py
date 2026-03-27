import httpx
from fastapi import HTTPException

from shared.utils.env import (
    get_api_origin,
    get_bot_token,
    get_discord_client_id,
    get_discord_client_secret,
)


DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USER_URL = "https://discord.com/api/users/@me"
DISCORD_GUILDS_URL = "https://discord.com/api/guilds"


def get_redirect_uri() -> str:
    return f"{get_api_origin()}/api/auth/callback"


def get_bot_invite_callback_uri() -> str:
    return f"{get_api_origin()}/api/guild/bot-invite-callback"


def get_login_url() -> str:
    client_id = get_discord_client_id()
    redirect_uri = get_redirect_uri()
    return (
        f"{DISCORD_OAUTH_URL}"
        f"?client_id={client_id}"
        f"&scope=identify"
        f"&response_type=code"
        f"&redirect_uri={redirect_uri}"
    )


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


async def get_me(access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            DISCORD_USER_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch Discord user")
        return response.json()


async def get_guild(guild_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{DISCORD_GUILDS_URL}/{guild_id}",
            headers={"Authorization": f"Bot {get_bot_token()}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Discord guild")
        return response.json()


async def get_user(discord_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://discord.com/api/users/{discord_id}",
            headers={"Authorization": f"Bot {get_bot_token()}"},
        )
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch Discord user")
        return response.json()


async def get_profile(discord_id: str) -> tuple[bytes, str]:
    """Returns (image_bytes, content_type)."""
    user = await get_user(discord_id)
    avatar_hash = user.get("avatar")
    if avatar_hash:
        ext = "gif" if avatar_hash.startswith("a_") else "png"
        url = f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.{ext}?size=256"
        content_type = f"image/{ext}"
    else:
        default_index = (int(discord_id) >> 22) % 6
        url = f"https://cdn.discordapp.com/embed/avatars/{default_index}.png"
        content_type = "image/png"

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to fetch profile")
        return response.content, content_type


async def send_message(discord_id: str, embeds: list[dict]) -> bool:
    bot_token = get_bot_token()
    headers = {"Authorization": f"Bot {bot_token}", "Content-Type": "application/json"}

    async with httpx.AsyncClient(timeout=10.0) as client:
        ch_response = await client.post(
            "https://discord.com/api/users/@me/channels",
            headers=headers,
            json={"recipient_id": discord_id},
        )
        if ch_response.status_code != 200:
            return False

        channel_id = ch_response.json()["id"]
        msg_response = await client.post(
            f"https://discord.com/api/channels/{channel_id}/messages",
            headers=headers,
            json={"embeds": embeds},
        )
        return msg_response.status_code == 200
