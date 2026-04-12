from typing import Annotated
from urllib.parse import urlparse

from pydantic import (
    AfterValidator,
    BaseModel,
    BeforeValidator,
    StringConstraints,
    model_validator,
)


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


NullableStr = Annotated[str | None, BeforeValidator(_nullable_str)]
NameStr = Annotated[str, StringConstraints(min_length=1, max_length=256)]
NullableNameStr = Annotated[
    str | None,
    StringConstraints(min_length=1, max_length=256),
    BeforeValidator(_nullable_str),
]
UrlStr = Annotated[
    str,
    StringConstraints(min_length=1, max_length=2048),
    AfterValidator(_validate_url),
]
NullableUrlStr = Annotated[
    str | None,
    BeforeValidator(_nullable_str),
    StringConstraints(min_length=1, max_length=2048),
    AfterValidator(_validate_nullable_url),
]
DiscordId = Annotated[str, BeforeValidator(str)]


class BaseDTO(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def strip_strings(cls, data: object) -> object:
        if isinstance(data, dict):
            return {k: v.strip() if isinstance(v, str) else v for k, v in data.items()}
        return data


__all__ = [
    "BaseDTO",
    "DiscordId",
    "NameStr",
    "NullableNameStr",
    "NullableStr",
    "NullableUrlStr",
    "UrlStr",
]
