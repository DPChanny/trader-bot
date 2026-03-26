from fastapi import APIRouter, Depends, Header, HTTPException
from fastapi.responses import RedirectResponse
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.auth_dto import TokenResponse
from shared.utils.database import get_db
from shared.utils.env import get_app_origin

from ..services.auth_service import (
    create_manager_jwt,
    exchange_code,
    get_discord_login_url,
    get_discord_user,
    login_or_register,
    refresh_manager_jwt,
)


auth_router = APIRouter(prefix="/auth", tags=["auth"])


@auth_router.get("/login")
async def login_route():
    url = get_discord_login_url()
    return RedirectResponse(url=url)


@auth_router.get("/callback")
async def callback_route(code: str, db: Session = Depends(get_db)):
    access_token = await exchange_code(code)
    user_data = await get_discord_user(access_token)

    discord_id = str(user_data["id"])
    username = user_data.get("global_name") or user_data.get("username", "")

    manager = login_or_register(discord_id, username, db)
    jwt_token = create_manager_jwt(manager)

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
        new_token = refresh_manager_jwt(token)
        return TokenResponse(token=new_token)
    except Exception as e:
        logger.warning(f"Token refresh failed: type={type(e).__name__}")
        raise HTTPException(status_code=401, detail="Token refresh failed") from e
