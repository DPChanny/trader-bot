import hashlib
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import Header, HTTPException
from loguru import logger
from pydantic import BaseModel

from shared.utils.env import get_jwt_algorithm, get_jwt_secret


class TokenPayload(BaseModel):
    discord_id: int
    exp: int
    iat: int


ACCESS_TOKEN_EXPIRATION_MINUTES = 15
REFRESH_TOKEN_EXPIRATION_DAYS = 30


def create_token(
    discord_id: int,
) -> str:
    now = datetime.now(UTC)
    expiration = now + timedelta(minutes=ACCESS_TOKEN_EXPIRATION_MINUTES)
    token_data = {
        "discord_id": discord_id,
        "exp": int(expiration.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(token_data, get_jwt_secret(), algorithm=get_jwt_algorithm())


def create_refresh_token(discord_id: int) -> str:
    now = datetime.now(UTC)
    expiration = now + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)
    token_data = {
        "discord_id": discord_id,
        "exp": int(expiration.timestamp()),
        "iat": int(now.timestamp()),
        "type": "refresh",
    }
    return jwt.encode(token_data, get_jwt_secret(), algorithm=get_jwt_algorithm())


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def decode_token(token: str) -> TokenPayload:
    try:
        token_payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
        )
        return TokenPayload(**token_payload)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token") from None


async def verify_token(authorization: str = Header(None)) -> TokenPayload:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")
    return decode_token(token)
