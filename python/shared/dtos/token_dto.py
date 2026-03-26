from . import BaseDto


class LoginDto(BaseDto):
    code: str


class TokenDto(BaseDto):
    token: str
