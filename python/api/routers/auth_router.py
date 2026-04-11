from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth_dto import ExchangeTokenDTO, RefreshTokenDTO, TokenDTO
from shared.utils.database import get_session

from ..services.auth_service import (
    callback_service,
    exchange_token_service,
    login_service,
    logout_service,
    refresh_token_service,
)
from ..utils.token import verify_token


auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.get("/login")
async def login_route(
    redirect: str | None = Query(default=None),
) -> RedirectResponse:
    return await login_service(redirect=redirect)


@auth_router.get("/login/callback")
async def callback_route(
    code: str = Query(),
    state: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    return await callback_service(code, state, session)


@auth_router.post("/token/exchange", response_model=TokenDTO)
async def exchange_token_route(dto: ExchangeTokenDTO) -> TokenDTO:
    return await exchange_token_service(dto)


@auth_router.post("/token/refresh", response_model=TokenDTO)
async def refresh_token_route(
    dto: RefreshTokenDTO,
    session: AsyncSession = Depends(get_session),
) -> TokenDTO:
    return await refresh_token_service(dto, session)


@auth_router.post("/logout", status_code=204)
async def logout_route(
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
) -> None:
    return await logout_service(discord_id, session)
