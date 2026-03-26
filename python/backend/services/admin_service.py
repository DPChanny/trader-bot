from shared.utils.env import get_admin_password

from ..utils.jwt import (
    create_jwt_token,
    refresh_jwt_token,
    should_refresh_token,
)


def verify_password_service(password: str) -> bool:
    return password == get_admin_password()


def generate_token_service() -> str:
    payload = {"role": "admin", "type": "admin_access"}
    return create_jwt_token(payload)


def refresh_service(token: str) -> str:
    return refresh_jwt_token(token)


def should_refresh_service(token: str) -> bool:
    return should_refresh_token(token)
