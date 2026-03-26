from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.token_dto import LoginDto, TokenDto
from shared.utils.database import get_db

from ..services.token_service import (
    get_token_service,
    refresh_token_service,
)
from ..utils.token import verify_token


token_router = APIRouter(prefix="/token", tags=["token"])


@token_router.post("", response_model=TokenDto, status_code=201)
async def get_token_route(dto: LoginDto, db: Session = Depends(get_db)):
    return await get_token_service(dto, db)


@token_router.patch("", response_model=TokenDto)
async def refresh_token_route(payload: dict = Depends(verify_token)):
    return refresh_token_service(payload)
