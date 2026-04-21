import time
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from typing import ClassVar

import jwt
from fastapi import Header

from shared.utils.env import get_jwt_algorithm, get_jwt_secret
from shared.utils.error import AuthErrorCode, HTTPError, TokenError, TokenErrorCode


_ACCESS_TOKEN_LIFETIME = timedelta(minutes=15)
_REFRESH_TOKEN_LIFETIME = timedelta(days=15)
_EXCHANGE_TOKEN_LIFETIME = timedelta(seconds=60)
_STATE_TOKEN_LIFETIME = timedelta(minutes=5)


class JWTToken:
    @dataclass
    class Payload:
        user_id: int
        expires_at: datetime
        type: str

    _type: ClassVar[str]
    _lifetime: ClassVar[timedelta]

    @classmethod
    def create(cls, user_id: int) -> tuple[str, JWTToken.Payload]:
        expires_at = datetime.now(UTC) + cls._lifetime
        payload = cls.Payload(user_id=user_id, expires_at=expires_at, type=cls._type)
        token = jwt.encode(
            {
                "user_id": payload.user_id,
                "exp": int(payload.expires_at.timestamp()),
                "type": payload.type,
            },
            get_jwt_secret(),
            algorithm=get_jwt_algorithm(),
        )
        return token, payload

    @classmethod
    def decode(cls, jwt_token: str) -> JWTToken.Payload:
        try:
            data = jwt.decode(
                jwt_token, get_jwt_secret(), algorithms=[get_jwt_algorithm()]
            )
            if data.get("type") != cls._type:
                raise TokenError(TokenErrorCode.IncorrectJWTToken)
            return cls.Payload(
                user_id=data["user_id"],
                expires_at=datetime.fromtimestamp(data["exp"], UTC),
                type=data["type"],
            )
        except jwt.ExpiredSignatureError:
            raise TokenError(TokenErrorCode.ExpiredJWTToken) from None
        except jwt.InvalidTokenError:
            raise TokenError(TokenErrorCode.IncorrectJWTToken) from None


class AccessToken(JWTToken):
    _type = "access"
    _lifetime = _ACCESS_TOKEN_LIFETIME


class RefreshToken(JWTToken):
    _type = "refresh"
    _lifetime = _REFRESH_TOKEN_LIFETIME


class ExchangeToken:
    @dataclass
    class Payload:
        access_token: str
        refresh_token: str
        expires_at_monotonic: float

    _exchange_tokens: dict[str, ExchangeToken.Payload] = {}

    @classmethod
    def _purge(cls) -> None:
        now = time.monotonic()
        expired = [
            code
            for code, payload in cls._exchange_tokens.items()
            if payload.expires_at_monotonic <= now
        ]
        for k in expired:
            cls._exchange_tokens.pop(k, None)

    @classmethod
    def create(cls, access_token: str, refresh_token: str) -> str:
        cls._purge()
        code = token_urlsafe(32)
        cls._exchange_tokens[code] = ExchangeToken.Payload(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at_monotonic=time.monotonic()
            + _EXCHANGE_TOKEN_LIFETIME.total_seconds(),
        )
        return code

    @classmethod
    def consume(cls, exchange_token: str) -> tuple[str, str]:
        cls._purge()
        entry = cls._exchange_tokens.pop(exchange_token, None)
        if entry is None:
            raise TokenError(TokenErrorCode.ExchangeFailed)
        return entry.access_token, entry.refresh_token


class StateToken:
    @dataclass
    class Payload:
        redirect_path: str | None
        expires_at_monotonic: float

    _states: dict[str, StateToken.Payload] = {}

    @classmethod
    def _purge(cls) -> None:
        now = time.monotonic()
        expired = [
            state
            for state, payload in cls._states.items()
            if payload.expires_at_monotonic <= now
        ]
        for state in expired:
            cls._states.pop(state, None)

    @classmethod
    def create(cls, redirect_path: str | None) -> str:
        cls._purge()
        state = token_urlsafe(32)
        cls._states[state] = cls.Payload(
            redirect_path=redirect_path,
            expires_at_monotonic=time.monotonic()
            + _STATE_TOKEN_LIFETIME.total_seconds(),
        )
        return state

    @classmethod
    def consume(cls, state: str | None) -> str | None:
        cls._purge()
        if not state:
            raise TokenError(TokenErrorCode.ExchangeFailed)

        payload = cls._states.pop(state, None)
        if payload is None:
            raise TokenError(TokenErrorCode.ExchangeFailed)

        return payload.redirect_path


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
        raise error from None
    except HTTPError:
        raise
