from fastapi import APIRouter, Header, HTTPException
from loguru import logger

from shared.dtos.admin_dto import (
    AdminLoginRequest,
    AdminLoginResponse,
    TokenRefreshResponse,
)

from ..services.admin_service import (
    generate_admin_token,
    refresh_admin_token,
    verify_admin_password,
)


admin_router = APIRouter(prefix="/admin", tags=["admin"])


@admin_router.post("/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    if not verify_admin_password(request.password):
        logger.warning("Admin login failed: reason=invalid_password")
        raise HTTPException(status_code=401, detail="Admin login failed")

    token = generate_admin_token()
    return AdminLoginResponse(token=token, message="Login successful")


@admin_router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(authorization: str = Header(None)):
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")

    try:
        new_token = refresh_admin_token(token)
        return TokenRefreshResponse(
            token=new_token, message="Token refreshed successfully"
        )
    except Exception as e:
        logger.warning(f"Token validation failed: type={type(e).__name__}")
        raise HTTPException(status_code=401, detail="Token validation failed") from e
