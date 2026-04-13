import urllib.parse

import httpx

from shared.utils.env import (
    get_api_origin,
    get_discord_bot_token,
    get_discord_client_id,
    get_discord_client_secret,
)
from shared.utils.error import HTTPError, DiscordErrorCode


DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
DISCORD_USERS_URL = "https://discord.com/api/users"
DISCORD_CHANNELS_URL = "https://discord.com/api/channels"


def _get_login_callback_url() -> str:
    return f"{get_api_origin()}/api/auth/login/callback"


def get_login_url(state: str | None = None) -> str:
    params: dict = {
        "client_id": get_discord_client_id(),
        "scope": "identify",
        "response_type": "code",
        "redirect_uri": _get_login_callback_url(),
    }
    if state:
        params["state"] = state
    return f"{DISCORD_OAUTH_URL}?{urllib.parse.urlencode(params)}"


async def get_me(code: str) -> dict:
    data = {
        "client_id": get_discord_client_id(),
        "client_secret": get_discord_client_secret(),
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": _get_login_callback_url(),
    }
    async with httpx.AsyncClient() as client:
        access_token_response = await client.post(
            DISCORD_TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if access_token_response.status_code != 200:
            raise HTTPError(DiscordErrorCode.ExchangeFailed)
        access_token = access_token_response.json()["access_token"]

        me_response = await client.get(
            f"{DISCORD_USERS_URL}/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if me_response.status_code != 200:
            raise HTTPError(DiscordErrorCode.FetchFailed)
        return me_response.json()


async def send_message(user_id: int, embeds: list[dict]) -> None:
    headers = {
        "Authorization": f"Bot {get_discord_bot_token()}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient() as client:
        ch_response = await client.post(
            f"{DISCORD_USERS_URL}/@me/channels",
            headers=headers,
            json={"recipient_id": str(user_id)},
        )
        if ch_response.status_code != 200:
            raise HTTPError(DiscordErrorCode.FetchFailed)

        channel_id = ch_response.json()["id"]
        msg_response = await client.post(
            f"{DISCORD_CHANNELS_URL}/{channel_id}/messages",
            headers=headers,
            json={"embeds": embeds},
        )
        if msg_response.status_code != 200:
            raise HTTPError(DiscordErrorCode.FetchFailed)
