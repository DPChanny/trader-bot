import base64
import urllib.parse

from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth_dto import ExchangeTokenDTO, JwtTokenDTO, RefreshTokenDTO
from shared.utils.env import get_app_origin
from shared.utils.error import AppError, AuthErrorCode
from shared.utils.service import service
from shared.utils.user import upsert_user

from ..utils.discord import get_login_url, get_me
from ..utils.token import AccessToken, ExchangeToken, RefreshToken


@service
async def login_service(redirect: str | None = None) -> RedirectResponse:
    state = base64.urlsafe_b64encode(redirect.encode()).decode() if redirect else None
    return RedirectResponse(url=get_login_url(state))


@service
async def callback_service(
    code: str, state: str | None, session: AsyncSession, event
) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = int(user_data["id"])
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    user = await upsert_user(discord_id, name, avatar_hash, session)
    event |= user.model_dump()

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


@service
async def exchange_token_service(dto: ExchangeTokenDTO) -> JwtTokenDTO:
    token_pair = ExchangeToken.consume(dto.exchange_token)
    if token_pair is None:
        raise AppError(AuthErrorCode.ExchangeFailed)

    token, refresh_token = token_pair
    return JwtTokenDTO(access_token=token, refresh_token=refresh_token)


@service
async def refresh_token_service(dto: RefreshTokenDTO, event) -> JwtTokenDTO:
    rt_payload = RefreshToken.decode(dto.refresh_token)
    access_token, _ = AccessToken.create(rt_payload.user_id)
    new_refresh_token, _ = RefreshToken.create(rt_payload.user_id)
    event |= {"discord_id": rt_payload.user_id}
    return JwtTokenDTO(access_token=access_token, refresh_token=new_refresh_token)
