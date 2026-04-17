import base64
import urllib.parse

from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth import ExchangeTokenDTO, JWTTokenDTO, RefreshTokenDTO
from shared.utils.env import get_app_origin
from shared.utils.error import HTTPError, TokenError
from shared.utils.service import Event, http_service, set_event_response
from shared.utils.user import upsert_user

from ..utils.discord import get_login_url, get_me
from ..utils.token import AccessToken, ExchangeToken, RefreshToken


@http_service
async def login_service(
    event: Event,
    redirect: str | None = None,
) -> RedirectResponse:
    state = base64.urlsafe_b64encode(redirect.encode()).decode() if redirect else None
    response = RedirectResponse(url=get_login_url(state))
    return set_event_response(event, response)


@http_service
async def login_callback_service(
    code: str, state: str | None, session: AsyncSession, event: Event
) -> RedirectResponse:
    user_data = await get_me(code)

    discord_id = int(user_data["id"])
    name = user_data.get("global_name") or user_data.get("username", "")
    avatar_hash = user_data.get("avatar")

    user = await upsert_user(discord_id, name, avatar_hash, session)

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
    response = RedirectResponse(url=redirect_url)
    return set_event_response(event, response)


@http_service
async def exchange_token_service(dto: ExchangeTokenDTO, event: Event) -> JWTTokenDTO:
    try:
        token_pair = ExchangeToken.consume(dto.exchange_token)
    except TokenError as e:
        raise HTTPError(e.code) from None

    token, refresh_token = token_pair
    response = JWTTokenDTO(access_token=token, refresh_token=refresh_token)
    return set_event_response(event, response)


@http_service
async def refresh_token_service(dto: RefreshTokenDTO, event: Event) -> JWTTokenDTO:
    try:
        rt_payload = RefreshToken.decode(dto.refresh_token)
    except TokenError as e:
        raise HTTPError(e.code) from None
    access_token, _ = AccessToken.create(rt_payload.user_id)
    new_refresh_token, _ = RefreshToken.create(rt_payload.user_id)
    response = JWTTokenDTO(access_token=access_token, refresh_token=new_refresh_token)
    return set_event_response(event, response)
