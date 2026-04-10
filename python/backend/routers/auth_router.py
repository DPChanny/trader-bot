from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.token_dto import RefreshDTO
from shared.utils.database import get_session

from ..services.auth_service import (
    callback_service,
    login_service,
    refresh_token_service,
)


auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.get("/login")
async def login_route(
    next: str | None = Query(default=None),
) -> RedirectResponse:
    return await login_service(next_path=next)


@auth_router.get("/login/callback")
async def callback_route(
    code: str = Query(),
    state: str | None = Query(default=None),
    session: AsyncSession = Depends(get_session),
) -> RedirectResponse:
    return await callback_service(code, state, session)


@auth_router.post("/token/refresh")
async def refresh_token_route(
    dto: RefreshDTO,
    session: AsyncSession = Depends(get_session),
) -> dict:
    return await refresh_token_service(dto, session)
