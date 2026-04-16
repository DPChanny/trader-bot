from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.auth import ExchangeTokenDTO, JWTTokenDTO, RefreshTokenDTO
from shared.utils.database import get_session

from ..services.auth_service import (
    callback_service,
    exchange_token_service,
    login_service,
    refresh_token_service,
)


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


@auth_router.post("/token/exchange", response_model=JWTTokenDTO)
async def exchange_token_route(dto: ExchangeTokenDTO) -> JWTTokenDTO:
    return await exchange_token_service(dto)


@auth_router.post("/token/refresh", response_model=JWTTokenDTO)
async def refresh_token_route(dto: RefreshTokenDTO) -> JWTTokenDTO:
    return await refresh_token_service(dto)
