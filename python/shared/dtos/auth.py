from . import BaseDTO


class ExchangeTokenDTO(BaseDTO):
    exchange_token: str


class RefreshTokenDTO(BaseDTO):
    refresh_token: str


class JWTTokenDTO(BaseDTO):
    access_token: str
    refresh_token: str
