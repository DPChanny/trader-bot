from fastapi import APIRouter, Header, HTTPException
from loguru import logger

from shared.dtos.admin_dto import (
    AdminLoginRequest,
    TokenResponse,
)

from ..services.admin_service import (
    generate_token_service,
    refresh_service,
    verify_password_service,
)


admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.post("/token", response_model=TokenResponse, status_code=201)
async def login_route(request: AdminLoginRequest):
    if not verify_password_service(request.password):
        logger.warning("Admin login failed: reason=invalid_password")
        raise HTTPException(status_code=401, detail="Admin login failed")

    token = generate_token_service()
    return TokenResponse(token=token)


@admin_router.post("/token/refresh", response_model=TokenResponse)
async def refresh_route(authorization: str = Header(None)):
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")

    try:
        new_token = refresh_service(token)
        return TokenResponse(token=new_token)
    except Exception as e:
        logger.warning(f"Token validation failed: type={type(e).__name__}")
        raise HTTPException(status_code=401, detail="Token validation failed") from e
