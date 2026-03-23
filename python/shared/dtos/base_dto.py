from typing import TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class BaseResponseDTO[T](BaseModel):
    success: bool
    code: int
    message: str
    data: T | None = None
