from typing import Annotated

from pydantic import BaseModel, BeforeValidator, model_validator


def _nullable_str(v: object) -> object:
    if isinstance(v, str) and not v:
        return None
    return v


NullableStr = Annotated[str | None, BeforeValidator(_nullable_str)]
DiscordId = Annotated[str, BeforeValidator(str)]


class BaseDTO(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def strip_strings(cls, data: object) -> object:
        if isinstance(data, dict):
            return {k: v.strip() if isinstance(v, str) else v for k, v in data.items()}
        return data


__all__ = ["BaseDTO", "DiscordId", "NullableStr"]
