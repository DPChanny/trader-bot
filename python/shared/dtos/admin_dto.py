from . import BaseDto


class AdminLoginRequest(BaseDto):
    password: str


class TokenResponse(BaseDto):
    token: str
