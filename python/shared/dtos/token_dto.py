from . import BaseDto


class LoginDto(BaseDto):
    code: str


class RefreshDto(BaseDto):
    refresh_token: str


class TokenDto(BaseDto):
    token: str
    refresh_token: str
