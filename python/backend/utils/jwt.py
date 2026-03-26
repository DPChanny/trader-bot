from datetime import UTC, datetime, timedelta

import jwt
from loguru import logger

from shared.utils.env import get_jwt_algorithm, get_jwt_secret


JWT_EXPIRATION_HOURS = 24
JWT_REFRESH_THRESHOLD_HOURS = 6


def create_jwt_token(
    payload: dict, expiration_hours: int = JWT_EXPIRATION_HOURS
) -> str:
    now = datetime.now(UTC)
    expiration = now + timedelta(hours=expiration_hours)
    token_data = {
        **payload,
        "exp": int(expiration.timestamp()),
        "iat": int(now.timestamp()),
    }
    return jwt.encode(token_data, get_jwt_secret(), algorithm=get_jwt_algorithm())


def decode_jwt_token(token: str) -> dict:
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
        decode_jwt_token(token)
        return False
    except Exception as e:
        if "expired" in str(e).lower():
            return True
        raise


def should_refresh_token(token: str) -> bool:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"verify_exp": False},
        )
        exp_timestamp = payload.get("exp")
        if not exp_timestamp:
            return True

        exp_datetime = datetime.fromtimestamp(exp_timestamp, tz=UTC)
        time_remaining = exp_datetime - datetime.now(UTC)

        return time_remaining < timedelta(hours=JWT_REFRESH_THRESHOLD_HOURS)
    except Exception:
        return True


def refresh_jwt_token(token: str) -> str:
    try:
        payload = jwt.decode(
            token,
            get_jwt_secret(),
            algorithms=[get_jwt_algorithm()],
            options={"verify_exp": False},
        )

        payload.pop("exp", None)
        payload.pop("iat", None)

        return create_jwt_token(payload)
    except jwt.InvalidTokenError as e:
        raise Exception("Invalid token for refresh") from e
