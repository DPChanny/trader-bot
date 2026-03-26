import hashlib
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Header, HTTPException
from loguru import logger
from pydantic import BaseModel

from shared.utils.env import get_jwt_algorithm, get_jwt_secret


class Payload(BaseModel):
    user_id: int
    discord_id: str
    exp: int
    iat: int


JWT_EXPIRATION_MINUTES = 15


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_token(
    user_id: int,
    discord_id: str,
    expiration_minutes: int = JWT_EXPIRATION_MINUTES,
) -> str:
    now = datetime.now(UTC)
    expiration = now + timedelta(minutes=expiration_minutes)
    token_data = {
        "user_id": user_id,
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
        return Payload(**payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token") from None


async def verify_token(authorization: str = Header(None)) -> Payload:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")
    return decode_token(token)
