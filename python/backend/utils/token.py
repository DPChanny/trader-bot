import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from typing import ClassVar

import jwt
from fastapi import Header

from shared.utils.env import get_jwt_algorithm, get_jwt_secret
from shared.utils.error import AuthErrorCode, HTTPError, TokenError, TokenErrorCode

from .redis import get_redis


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
    @classmethod
    async def create(cls, access_token: str, refresh_token: str) -> str:
        code = token_urlsafe(32)
        r = get_redis()
        payload = {"access_token": access_token, "refresh_token": refresh_token}
        await r.setex(
            f"exchange_token:{code}",
            int(_EXCHANGE_TOKEN_LIFETIME.total_seconds()),
            json.dumps(payload),
        )
        return code

    @classmethod
    async def consume(cls, exchange_token: str) -> tuple[str, str]:
        r = get_redis()
        key = f"exchange_token:{exchange_token}"
        data = await r.get(key)
        if not data:
            raise TokenError(TokenErrorCode.ExchangeFailed)

        await r.delete(key)
        payload = json.loads(data)
        return payload["access_token"], payload["refresh_token"]


class StateToken:
    @classmethod
    async def create(cls, payload: dict) -> str:
        state = token_urlsafe(32)
        r = get_redis()
        await r.setex(
            f"state_token:{state}",
            int(_STATE_TOKEN_LIFETIME.total_seconds()),
            json.dumps(payload),
        )
        return state

    @classmethod
    async def consume(cls, state_token: str | None) -> dict:
        if not state_token:
            raise TokenError(TokenErrorCode.ExchangeFailed)

        r = get_redis()
        key = f"state_token:{state_token}"
        data = await r.get(key)
        if data is None:
            raise TokenError(TokenErrorCode.ExchangeFailed)

        await r.delete(key)
        return json.loads(data)


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
