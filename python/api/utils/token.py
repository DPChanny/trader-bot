import dataclasses
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from time import time
from typing import ClassVar

import jwt
from fastapi import Header

from shared.utils.env import get_jwt_algorithm, get_jwt_secret
from shared.utils.error import AuthErrorCode, HTTPError, TokenError, ValidationErrorCode


_ACCESS_TOKEN_EXPIRATION_MINUTES = 15
_REFRESH_TOKEN_EXPIRATION_DAYS = 15
_EXCHANGE_TOKEN_EXPIRATION_SECONDS = 60


class JWTToken:
    @dataclass
    class Payload:
        user_id: int
        exp: int
        type: str

    _type: ClassVar[str]
    _exp_delta: ClassVar[timedelta]

    @classmethod
    def create(cls, user_id: int) -> tuple[str, "JWTToken.Payload"]:
        exp = datetime.now(UTC) + cls._exp_delta
        payload = cls.Payload(
            user_id=user_id,
            exp=int(exp.timestamp()),
            type=cls._type,
        )
        token = jwt.encode(
            dataclasses.asdict(payload), get_jwt_secret(), algorithm=get_jwt_algorithm()
        )
        return token, payload

    @classmethod
    def decode(cls, jwt_token: str) -> "JWTToken.Payload":
        try:
            data = jwt.decode(
                jwt_token,
                get_jwt_secret(),
                algorithms=[get_jwt_algorithm()],
            )
            if data.get("type") != cls._type:
                raise TokenError(AuthErrorCode.IncorrectJWTToken)
            return cls.Payload(**data)
        except jwt.ExpiredSignatureError:
            raise TokenError(AuthErrorCode.ExpiredJWTToken) from None
        except jwt.InvalidTokenError:
            raise TokenError(ValidationErrorCode.Invalid) from None


class AccessToken(JWTToken):
    _type = "access"
    _exp_delta = timedelta(minutes=_ACCESS_TOKEN_EXPIRATION_MINUTES)


class RefreshToken(JWTToken):
    _type = "refresh"
    _exp_delta = timedelta(days=_REFRESH_TOKEN_EXPIRATION_DAYS)


class ExchangeToken:
    @dataclass
    class Payload:
        access_token: str
        refresh_token: str
        exp: float

    _exchange_tokens: dict[str, "ExchangeToken.Payload"] = {}

    @classmethod
    def _purge(cls) -> None:
        now = time()
        expired = [k for k, v in cls._exchange_tokens.items() if v.exp <= now]
        for k in expired:
            cls._exchange_tokens.pop(k, None)

    @classmethod
    def create(cls, access_token: str, refresh_token: str) -> str:
        cls._purge()
        code = token_urlsafe(32)
        cls._exchange_tokens[code] = ExchangeToken.Payload(
            access_token=access_token,
            refresh_token=refresh_token,
            exp=time() + _EXCHANGE_TOKEN_EXPIRATION_SECONDS,
        )
        return code

    @classmethod
    def consume(cls, exchange_token: str) -> tuple[str, str] | None:
        cls._purge()
        entry = cls._exchange_tokens.pop(exchange_token, None)
        if entry is None:
            return None
        return entry.access_token, entry.refresh_token


async def verify_access_token(authorization: str = Header(None)) -> int:
    try:
        if not authorization:
            raise HTTPError(AuthErrorCode.Unauthorized)
        if not authorization.startswith("Bearer "):
            raise HTTPError(AuthErrorCode.Unauthorized)
        token = authorization.removeprefix("Bearer ")
        return AccessToken.decode(token).user_id
    except TokenError as e:
        error = HTTPError(e.code)
        error.function = verify_access_token.__name__
        raise error from e
    except HTTPError as e:
        e.function = verify_access_token.__name__
        raise
