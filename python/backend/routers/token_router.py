from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.token_dto import LoginDto, RefreshDto, TokenDto
from shared.utils.database import get_async_db

from ..services.token_service import (
    get_token_service,
    refresh_token_service,
)


token_router = APIRouter(prefix="/token", tags=["token"])


@token_router.post("", response_model=TokenDto, status_code=201)
async def get_token_route(dto: LoginDto, db: AsyncSession = Depends(get_async_db)):
    return await get_token_service(dto, db)


@token_router.patch("", response_model=TokenDto)
async def refresh_token_route(
    dto: RefreshDto, db: AsyncSession = Depends(get_async_db)
):
    return await refresh_token_service(dto, db)
