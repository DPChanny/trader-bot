from fastapi import Header, HTTPException, Response
from loguru import logger

from .jwt import decode_jwt_token, refresh_jwt_token, should_refresh_token


async def verify_token(
    authorization: str = Header(None), response: Response = None
) -> dict:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")

    try:
        payload = decode_jwt_token(token)
        role = payload.get("role")
        if role != "manager":
            logger.warning(f"Auth failed: reason=non_manager, role={role}")
            raise HTTPException(status_code=403, detail="Auth failed")

        if response and should_refresh_token(token):
            try:
                new_token = refresh_jwt_token(token)
                response.headers["X-New-Token"] = new_token
            except Exception:
                pass

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Auth failed") from e
