from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.auth_dto import TokenResponse
from shared.utils.database import get_db
from shared.utils.env import get_app_origin

from ..services.auth_service import (
    callback_service,
    get_login_url_service,
    refresh_token_service,
)


auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.get("/login")
async def login_route():
    url = get_login_url_service()
    return RedirectResponse(url=url)


@auth_router.get("/callback")
async def callback_route(code: str, db: Session = Depends(get_db)):
    jwt_token = await callback_service(code, db)
    frontend_url = get_app_origin()
    return RedirectResponse(url=f"{frontend_url}/auth/callback?token={jwt_token}")


@auth_router.post("/token/refresh", response_model=TokenResponse)
async def refresh_route(authorization: str = Header(None)):
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")

    try:
        new_token = refresh_token_service(token)
        return TokenResponse(token=new_token)
    except Exception as e:
        logger.warning(f"Token refresh failed: type={type(e).__name__}")
        raise HTTPException(status_code=401, detail="Token refresh failed") from e
