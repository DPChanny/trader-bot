import urllib.parse

from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth import ExchangeTokenDTO, JWTTokenDTO, RefreshTokenDTO
from shared.utils.env import get_app_origin
from shared.utils.error import HTTPError, TokenError
from shared.utils.service import http_service
from shared.utils.upsert import upsert_user

from ..utils.discord import get_login_url, get_me
from ..utils.token import AccessToken, ExchangeToken, RefreshToken, StateToken


@http_service
async def login_service(redirect_path: str | None = None) -> RedirectResponse:
    state_token = await StateToken.create({"redirect_path": redirect_path})
    return RedirectResponse(url=get_login_url(state_token))


@http_service
async def login_callback_service(
    code: str, state_token: str | None, session: AsyncSession
) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = int(user_data["id"])
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    user = await upsert_user(discord_id, name, avatar_hash, session)

    access_token, _ = AccessToken.create(user.discord_id)
    refresh_token, _ = RefreshToken.create(user.discord_id)

    exchange_token = await ExchangeToken.create(access_token, refresh_token)
    try:
        payload = await StateToken.consume(state_token)
        redirect_path = payload.get("redirect_path")
    except TokenError as e:
        raise HTTPError(e.code) from None

    params = {"exchangeToken": exchange_token}
    if redirect_path:
        params["redirect"] = redirect_path

    redirect_url = (
        f"{get_app_origin()}/auth/login/callback?{urllib.parse.urlencode(params)}"
    )
    return RedirectResponse(url=redirect_url)


@http_service
async def exchange_token_service(dto: ExchangeTokenDTO) -> JWTTokenDTO:
    try:
        token_pair = await ExchangeToken.consume(dto.exchange_token)
    except TokenError as e:
        raise HTTPError(e.code) from None

    token, refresh_token = token_pair
    return JWTTokenDTO(access_token=token, refresh_token=refresh_token)


@http_service
async def refresh_token_service(dto: RefreshTokenDTO) -> JWTTokenDTO:
    try:
        rt_payload = RefreshToken.decode(dto.refresh_token)
    except TokenError as e:
        raise HTTPError(e.code) from None
    access_token, _ = AccessToken.create(rt_payload.user_id)
    new_refresh_token, _ = RefreshToken.create(rt_payload.user_id)
    return JWTTokenDTO(access_token=access_token, refresh_token=new_refresh_token)
