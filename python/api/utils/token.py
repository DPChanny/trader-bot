import hashlib
import uuid
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from time import time

import jwt
from fastapi import Header, HTTPException
from loguru import logger

from shared.utils.env import get_jwt_algorithm, get_jwt_secret


ACCESS_TOKEN_EXPIRATION_MINUTES = 15
REFRESH_TOKEN_EXPIRATION_DAYS = 30
EXCHANGE_TOKEN_EXPIRATION_SECONDS = 60


@dataclass
class ExchangeTokenPayload:
    token: str
    refresh_token: str
    exp: float


exchange_tokens: dict[str, ExchangeTokenPayload] = {}


def _manage_exchange_tokens() -> None:
    now = time()
    expired_exchange_tokens = [
        exchange_token
        for exchange_token, entry in exchange_tokens.items()
        if entry.exp <= now
    ]
    for exchange_token in expired_exchange_tokens:
        exchange_tokens.pop(exchange_token, None)


def create_exchange_token(token: str, refresh_token: str) -> str:
    _manage_exchange_tokens()
    exchange_token = token_urlsafe(32)
    exchange_tokens[exchange_token] = ExchangeTokenPayload(
        token=token,
        refresh_token=refresh_token,
        exp=time() + EXCHANGE_TOKEN_EXPIRATION_SECONDS,
    )
    return exchange_token


def consume_exchange_token(exchange_token: str) -> tuple[str, str] | None:
    _manage_exchange_tokens()
    entry = exchange_tokens.pop(exchange_token, None)
    if entry is None:
        return None
    return entry.token, entry.refresh_token


def create_access_token(
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


def decode_access_token(token: str) -> int:
    try:
        data = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
        )
        return int(data["discord_id"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token") from None


async def verify_access_token(authorization: str = Header(None)) -> int:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")

    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")

    token = authorization.replace("Bearer ", "")
    return decode_access_token(token)


def create_refresh_token(discord_id: int) -> tuple[str, str, int]:
    now = datetime.now(UTC)
    expiration = now + timedelta(days=REFRESH_TOKEN_EXPIRATION_DAYS)
    jti = uuid.uuid4().hex
    token_data = {
        "discord_id": discord_id,
        "exp": int(expiration.timestamp()),
        "iat": int(now.timestamp()),
        "type": "refresh",
        "jti": jti,
    }
    return (
        jwt.encode(token_data, get_jwt_secret(), algorithm=get_jwt_algorithm()),
        jti,
        int(expiration.timestamp()),
    )


def decode_refresh_token(token: str) -> tuple[int, str]:
    try:
        data = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
        )
        if data.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return int(data["discord_id"]), data["jti"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired") from None
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token") from None


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()
