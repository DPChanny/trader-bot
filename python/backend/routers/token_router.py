from fastapi import APIRouter, Depends, Header, HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.token_dto import LoginDto, TokenDto
from shared.utils.database import get_db

from ..services.token_service import (
    get_token_service,
    refresh_token_service,
)


token_router = APIRouter(prefix="/token", tags=["token"])


@token_router.post("", response_model=TokenDto, status_code=201)
async def get_token_route(dto: LoginDto, db: Session = Depends(get_db)):
    return await get_token_service(dto, db)


@token_router.post("/refresh", response_model=TokenDto)
async def refresh_token_route(authorization: str = Header(None)):
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")
    return refresh_token_service(token)
