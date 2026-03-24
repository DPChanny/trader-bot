from fastapi import Header, HTTPException, Response
from loguru import logger

from .jwt import decode_jwt_token, refresh_jwt_token, should_refresh_token


async def verify_admin_token(
    authorization: str = Header(None), response: Response = None
) -> dict:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Authorization header missing")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Invalid authorization format")

    token = authorization.replace("Bearer ", "")

    try:
        role = payload.get("role")
        if role != "admin":
            logger.warning(f"Auth failed: reason=non_admin, role={role}")
            raise HTTPException(status_code=403, detail="Admin access required")

        if response and should_refresh_token(token):
            try:
                new_token = refresh_jwt_token(token)
                response.headers["X-New-Token"] = new_token
            except Exception:
                pass

        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e)) from e
