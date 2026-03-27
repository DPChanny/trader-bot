from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.database import get_async_db

from ..services.auth_service import (
    callback_service,
    login_service,
    refresh_token_service,
)
from ..utils.token import Payload, verify_token


auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.get("/login")
async def login_route() -> RedirectResponse:
    return await login_service()


@auth_router.get("/login/callback")
async def callback_route(
    code: str = Query(),
    db: AsyncSession = Depends(get_async_db),
) -> RedirectResponse:
    return await callback_service(code, db)


@auth_router.post("/token/refresh")
async def refresh_token_route(
    payload: Payload = Depends(verify_token),
) -> dict:
    return await refresh_token_service(payload)
