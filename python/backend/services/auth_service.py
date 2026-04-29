import urllib.parse

from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth import ExchangeTokenDTO, JWTTokenDTO, RefreshTokenDTO
from shared.utils.env import get_app_origin
from shared.utils.error import HTTPError, TokenError
from shared.utils.service import http_service
from shared.repositories.user_repository import UserRepository

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

    user = await UserRepository(session).upsert(discord_id, name, avatar_hash)

    access_token = AccessToken.create(user.discord_id)
    refresh_token = RefreshToken.create(user.discord_id)

    exchange_token = await ExchangeToken.create(
        {"access_token": access_token, "refresh_token": refresh_token}
    )
    params = {"exchangeToken": exchange_token}
    if state_token is not None:
        try:
            payload = await StateToken.consume(state_token)
            params["redirect"] = payload["redirect_path"]
        except TokenError as e:
            raise HTTPError(e.code) from None

    redirect_url = (
        f"{get_app_origin()}/auth/login/callback?{urllib.parse.urlencode(params)}"
    )
    return RedirectResponse(url=redirect_url)


@http_service
async def exchange_token_service(dto: ExchangeTokenDTO) -> JWTTokenDTO:
    try:
        payload = await ExchangeToken.consume(dto.exchange_token)
        return JWTTokenDTO(
            access_token=payload["access_token"], refresh_token=payload["refresh_token"]
        )
    except TokenError as e:
        raise HTTPError(e.code) from None


@http_service
async def refresh_token_service(dto: RefreshTokenDTO) -> JWTTokenDTO:
    try:
        rt_payload = RefreshToken.decode(dto.refresh_token)
    except TokenError as e:
        raise HTTPError(e.code) from None
    access_token = AccessToken.create(rt_payload.user_id)
    new_refresh_token = RefreshToken.create(rt_payload.user_id)
    return JWTTokenDTO(access_token=access_token, refresh_token=new_refresh_token)
