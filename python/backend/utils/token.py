from datetime import UTC, datetime, timedelta
from typing import TypedDict, cast

import jwt
from fastapi import Header, HTTPException
from loguru import logger

from shared.utils.env import get_jwt_algorithm, get_jwt_secret


class Payload(TypedDict):
    manager_id: int
    discord_id: str
    exp: int
    iat: int


JWT_EXPIRATION_MINUTES = 15


def create_token(
    manager_id: int,
    discord_id: str,
    expiration_minutes: int = JWT_EXPIRATION_MINUTES,
) -> str:
    now = datetime.now(UTC)
    expiration = now + timedelta(minutes=expiration_minutes)
    token_data = {
        "manager_id": manager_id,
        "discord_id": discord_id,
        "exp": int(expiration.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(token_data, get_jwt_secret(), algorithm=get_jwt_algorithm())


def decode_token(token: str) -> Payload:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
        )
        return cast(Payload, payload)
    except jwt.ExpiredSignatureError as e:
        logger.warning("Token validation failed: reason=expired")
        raise HTTPException(status_code=401, detail="Token expired") from e
    except jwt.InvalidTokenError as e:
        logger.error(
            f"Token validation failed: reason=invalid, type={type(e).__name__}"
        )
        raise HTTPException(status_code=401, detail="Invalid token") from e


async def verify_token(authorization: str = Header(None)) -> Payload:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")
    return decode_token(token)
