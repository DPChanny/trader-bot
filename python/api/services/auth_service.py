import base64
import urllib.parse

from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth_dto import ExchangeTokenDTO, JwtTokenDTO, RefreshTokenDTO
from shared.error import AppError, Auth, service_error_handler
from shared.utils.env import get_app_origin
from shared.utils.user import upsert_user

from ..utils.discord import get_login_url, get_me
from ..utils.token import AccessToken, ExchangeToken, RefreshToken


@service_error_handler
async def login_service(redirect: str | None = None) -> RedirectResponse:
    state = base64.urlsafe_b64encode(redirect.encode()).decode() if redirect else None
    return RedirectResponse(url=get_login_url(state))


@service_error_handler
async def callback_service(
    code: str, state: str | None, session: AsyncSession
) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = int(user_data["id"])
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    user = await upsert_user(discord_id, name, avatar_hash, session)
    logger.bind(**user.model_dump()).info("")

    access_token, _ = AccessToken.create(user.discord_id)
    refresh_token, _ = RefreshToken.create(user.discord_id)

    exchange_token = ExchangeToken.create(access_token, refresh_token)
    redirect = base64.urlsafe_b64decode(state.encode()).decode() if state else None
    params = {
        "exchangeToken": exchange_token,
    }
    if redirect:
        params["redirect"] = redirect

    redirect_url = (
        f"{get_app_origin()}/auth/login/callback?{urllib.parse.urlencode(params)}"
    )
    return RedirectResponse(url=redirect_url)


@service_error_handler
async def exchange_token_service(dto: ExchangeTokenDTO) -> JwtTokenDTO:
    token_pair = ExchangeToken.consume(dto.exchange_token)
    if token_pair is None:
        raise AppError(Auth.InvalidExchangeToken)

    token, refresh_token = token_pair
    return JwtTokenDTO(access_token=token, refresh_token=refresh_token)


@service_error_handler
async def refresh_token_service(dto: RefreshTokenDTO) -> JwtTokenDTO:
    rt_payload = RefreshToken.decode(dto.refresh_token)
    access_token, _ = AccessToken.create(rt_payload.user_id)
    new_refresh_token, _ = RefreshToken.create(rt_payload.user_id)
    logger.bind(action="token_refreshed", discord_id=rt_payload.user_id).info("")
    return JwtTokenDTO(access_token=access_token, refresh_token=new_refresh_token)
