from typing import Annotated
from urllib.parse import urlparse

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    PlainSerializer,
    StringConstraints,
)


def _strip_str(v: object) -> object:
    return v.strip() if isinstance(v, str) else v


def _nullable_str(v: object) -> object:
    if isinstance(v, str) and not v:
        return None
    return v


def _validate_url(v: str) -> str:
    parsed = urlparse(v)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("url must be a valid http(s) url")
    return v


def _validate_nullable_url(v: str | None) -> str | None:
    if v is None:
        return None
    return _validate_url(v)


NameStr = Annotated[
    str, BeforeValidator(_strip_str), StringConstraints(min_length=1, max_length=256)
]
NullableNameStr = Annotated[
    str | None,
    BeforeValidator(_strip_str),
    BeforeValidator(_nullable_str),
    StringConstraints(min_length=1, max_length=256),
]
UrlStr = Annotated[
    str,
    BeforeValidator(_strip_str),
    StringConstraints(min_length=1, max_length=2048),
    AfterValidator(_validate_url),
]
NullableUrlStr = Annotated[
    str | None,
    BeforeValidator(_strip_str),
    BeforeValidator(_nullable_str),
    StringConstraints(min_length=1, max_length=2048),
    AfterValidator(_validate_nullable_url),
]
BigInt = Annotated[int, BeforeValidator(int), PlainSerializer(str)]


class BaseDTO(BaseModel):
    pass


__all__ = [
    "BigInt",
    "BaseDTO",
    "NameStr",
    "NullableNameStr",
    "NullableUrlStr",
    "UrlStr",
]
