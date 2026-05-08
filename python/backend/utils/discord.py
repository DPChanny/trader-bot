import urllib.parse

import httpx

from shared.utils.env import (
    get_api_origin,
    get_discord_bot_token,
    get_discord_client_id,
    get_discord_client_secret,
)
from shared.utils.error import HTTPError, UnexpectedErrorCode, log_external_error


_DISCORD_OAUTH_URL = "https://discord.com/oauth2/authorize"
_DISCORD_TOKEN_URL = "https://discord.com/api/oauth2/token"
_DISCORD_USERS_URL = "https://discord.com/api/users"
_DISCORD_CHANNELS_URL = "https://discord.com/api/channels"


def _get_login_callback_url() -> str:
    return f"{get_api_origin()}/api/auth/login/callback"


def get_login_url(state_token: str | None = None) -> str:
    params: dict = {
        "client_id": get_discord_client_id(),
        "scope": "identify",
        "response_type": "code",
        "redirect_uri": _get_login_callback_url(),
    }
    if state_token:
        params["state"] = state_token
    return f"{_DISCORD_OAUTH_URL}?{urllib.parse.urlencode(params)}"


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
            _DISCORD_TOKEN_URL,
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        if access_token_response.status_code != 200:
            log_external_error(access_token_response)
            raise HTTPError(UnexpectedErrorCode.External)
        access_token = access_token_response.json()["access_token"]

        me_response = await client.get(
            f"{_DISCORD_USERS_URL}/@me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if me_response.status_code != 200:
            log_external_error(me_response)
            raise HTTPError(UnexpectedErrorCode.External)
        return me_response.json()


async def send_channel_message(
    channel_id: int, content: str, embeds: list[dict]
) -> None:
    headers = {
        "Authorization": f"Bot {get_discord_bot_token()}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{_DISCORD_CHANNELS_URL}/{channel_id}/messages",
            headers=headers,
            json={"content": content, "embeds": embeds},
        )
        if response.status_code != 200:
            log_external_error(response)
            raise HTTPError(UnexpectedErrorCode.External)
