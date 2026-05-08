from typing import Annotated
from datetime import datetime

from pydantic import (
    BaseModel,
    BeforeValidator,
    ConfigDict,
    PlainSerializer,
    StringConstraints,
)


def _strip_str(v: object) -> object:
    return v.strip() if isinstance(v, str) else v


def _nullable_str(v: object) -> object:
    if isinstance(v, str) and not v:
        return None
    return v


NameStr = Annotated[
    str, BeforeValidator(_strip_str), StringConstraints(min_length=1, max_length=256)
]
NullableNameStr = Annotated[
    Annotated[str, StringConstraints(min_length=1, max_length=256)] | None,
    BeforeValidator(_strip_str),
    BeforeValidator(_nullable_str),
]
UrlStr = Annotated[
    str,
    BeforeValidator(_strip_str),
    StringConstraints(min_length=1, max_length=2048, pattern=r"^https?://[^\s]+$"),
]
NullableUrlStr = Annotated[
    Annotated[
        str,
        StringConstraints(min_length=1, max_length=2048, pattern=r"^https?://[^\s]+$"),
    ]
    | None,
    BeforeValidator(_strip_str),
    BeforeValidator(_nullable_str),
]
BigInt = Annotated[int, BeforeValidator(int), PlainSerializer(str)]


class BaseDTO(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class BaseEntityDTO(BaseDTO):
    created_at: datetime
    updated_at: datetime


__all__ = [
    "BigInt",
    "BaseDTO",
    "BaseEntityDTO",
    "NameStr",
    "NullableNameStr",
    "NullableUrlStr",
    "UrlStr",
]
