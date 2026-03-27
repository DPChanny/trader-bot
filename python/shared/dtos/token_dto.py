from . import BaseDTO


class LoginDTO(BaseDTO):
    code: str


class RefreshDTO(BaseDTO):
    refresh_token: str


class TokenDTO(BaseDTO):
    token: str
    refresh_token: str
