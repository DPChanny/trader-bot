from pydantic import BaseModel


class AdminLoginRequest(BaseModel):
    password: str


class TokenResponse(BaseModel):
    token: str
