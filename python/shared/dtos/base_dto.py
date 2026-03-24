from typing import Annotated, TypeVar

from pydantic import BaseModel, BeforeValidator


T = TypeVar("T")


def _empty_str_to_none(v: object) -> object:
    if isinstance(v, str) and not v.strip():
        return None
    return v


NullableStr = Annotated[str | None, BeforeValidator(_empty_str_to_none)]


class BaseResponseDTO[T](BaseModel):
    success: bool
    code: int
    message: str
    data: T | None = None
