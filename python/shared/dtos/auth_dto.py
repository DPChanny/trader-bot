from . import BaseDTO


class ExchangeTokenDTO(BaseDTO):
    exchange_token: str


class RefreshTokenDTO(BaseDTO):
    refresh_token: str


class TokenDTO(BaseDTO):
    token: str
    refresh_token: str
