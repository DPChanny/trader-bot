import dataclasses
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from time import time
from typing import ClassVar

import jwt
from fastapi import Header, HTTPException
from loguru import logger

from shared.utils.env import get_jwt_algorithm, get_jwt_secret


_ACCESS_TOKEN_EXPIRATION_MINUTES = 5
_REFRESH_TOKEN_EXPIRATION_DAYS = 7
_EXCHANGE_TOKEN_EXPIRATION_SECONDS = 60


class JwtToken:
    @dataclass
    class Payload:
        discord_id: int
        exp: int
        type: str

    _type: ClassVar[str]
    _exp_delta: ClassVar[timedelta]

    @classmethod
    def create(cls, discord_id: int) -> tuple[str, "JwtToken.Payload"]:
        expiration = datetime.now(UTC) + cls._exp_delta
        payload = cls.Payload(
            discord_id=discord_id,
            exp=int(expiration.timestamp()),
            type=cls._type,
        )
        token = jwt.encode(
            dataclasses.asdict(payload), get_jwt_secret(), algorithm=get_jwt_algorithm()
        )
        return token, payload

    @classmethod
    def decode(cls, token: str) -> "JwtToken.Payload":
        try:
            data = jwt.decode(
                token,
                get_jwt_secret(),
                algorithms=[get_jwt_algorithm()],
            )
            if data.get("type") != cls._type:
                raise HTTPException(status_code=401, detail="Invalid token type")
            return cls.Payload(**data)
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired") from None
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token") from None


class AccessToken(JwtToken):
    _type = "access"
    _exp_delta = timedelta(minutes=_ACCESS_TOKEN_EXPIRATION_MINUTES)


class RefreshToken(JwtToken):
    _type = "refresh"
    _exp_delta = timedelta(days=_REFRESH_TOKEN_EXPIRATION_DAYS)


class ExchangeToken:
    @dataclass
    class Payload:
        access_token: str
        refresh_token: str
        exp: float

    _store: dict[str, "ExchangeToken.Payload"] = {}

    @classmethod
    def _purge(cls) -> None:
        now = time()
        expired = [k for k, v in cls._store.items() if v.exp <= now]
        for k in expired:
            cls._store.pop(k, None)

    @classmethod
    def create(cls, token: str, refresh_token: str) -> str:
        cls._purge()
        code = token_urlsafe(32)
        cls._store[code] = ExchangeToken.Payload(
            access_token=token,
            refresh_token=refresh_token,
            exp=time() + _EXCHANGE_TOKEN_EXPIRATION_SECONDS,
        )
        return code

    @classmethod
    def consume(cls, code: str) -> tuple[str, str] | None:
        cls._purge()
        entry = cls._store.pop(code, None)
        if entry is None:
            return None
        return entry.access_token, entry.refresh_token


async def verify_access_token(authorization: str = Header(None)) -> int:
    if not authorization:
        logger.warning("Auth failed: reason=missing_header")
        raise HTTPException(status_code=401, detail="Auth failed")
    if not authorization.startswith("Bearer "):
        logger.warning("Auth failed: reason=invalid_format")
        raise HTTPException(status_code=401, detail="Auth failed")
    token = authorization.removeprefix("Bearer ")
    return AccessToken.decode(token).discord_id
