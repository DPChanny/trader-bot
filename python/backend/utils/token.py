import json
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from secrets import token_urlsafe
from typing import ClassVar

import jwt
from fastapi import Header

from shared.utils.env import get_jwt_algorithm, get_jwt_secret
from shared.utils.error import AuthErrorCode, HTTPError, TokenError, TokenErrorCode
from shared.utils.redis import get_redis


class JWTToken:
    @dataclass
    class Payload:
        user_id: int
        expires_at: datetime
        type: str

    _type: ClassVar[str]
    _lifetime: ClassVar[timedelta]

    @classmethod
    def create(cls, user_id: int) -> str:
        expires_at = datetime.now(UTC) + cls._lifetime
        payload = cls.Payload(user_id=user_id, expires_at=expires_at, type=cls._type)
        jwt_token = jwt.encode(
            {
                "user_id": payload.user_id,
                "exp": int(payload.expires_at.timestamp()),
                "type": payload.type,
            },
            get_jwt_secret(),
            algorithm=get_jwt_algorithm(),
        )
        return jwt_token

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
    _type = "access_token"
    _lifetime = timedelta(minutes=15)


class RefreshToken(JWTToken):
    _type = "refresh_token"
    _lifetime = timedelta(days=15)


class RedisToken:
    _key: ClassVar[str]
    _lifetime: ClassVar[timedelta]

    @classmethod
    async def create(cls, payload: dict) -> str:
        redis_token = token_urlsafe(32)
        r = get_redis()
        await r.setex(
            f"{cls._key}:{redis_token}",
            int(cls._lifetime.total_seconds()),
            json.dumps(payload),
        )
        return redis_token

    @classmethod
    async def consume(cls, redis_token: str) -> dict:
        r = get_redis()
        key = f"{cls._key}:{redis_token}"
        data = await r.getdel(key)
        if data is None:
            raise TokenError(TokenErrorCode.ConsumeFailed)
        return json.loads(data)


class ExchangeToken(RedisToken):
    _key = "exchange_token"
    _lifetime = timedelta(seconds=60)


class StateToken(RedisToken):
    _key = "state_token"
    _lifetime = timedelta(minutes=5)


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
