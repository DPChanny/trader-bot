from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Header, HTTPException
from loguru import logger

from shared.utils.env import get_jwt_algorithm, get_jwt_secret


JWT_EXPIRATION_HOURS = 24


def create_token(payload: dict, expiration_hours: int = JWT_EXPIRATION_HOURS) -> str:
    now = datetime.now(UTC)
    expiration = now + timedelta(hours=expiration_hours)
    token_data = {
        **payload,
        "exp": int(expiration.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(token_data, get_jwt_secret(), algorithm=get_jwt_algorithm())


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"verify_iat": False},
        )
        return payload
    except jwt.ExpiredSignatureError as e:
        logger.warning("Token validation failed: reason=expired")
        raise Exception("Token has expired") from e
    except jwt.InvalidTokenError as e:
        logger.error(
            f"Token validation failed: reason=invalid, type={type(e).__name__}"
        )
        raise Exception("Invalid token") from e


def is_token_expired(token: str) -> bool:
    try:
        decode_token(token)
        return False
    except Exception as e:
        if "expired" in str(e).lower():
            return True
        raise


async def verify_token(authorization: str = Header(None)) -> dict:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")

    try:
        payload = decode_token(token)
        role = payload.get("role")
        if role != "manager":
            logger.warning(f"Auth failed: reason=non_manager, role={role}")
            raise HTTPException(status_code=403, detail="Auth failed")

        return payload
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Auth failed") from e
