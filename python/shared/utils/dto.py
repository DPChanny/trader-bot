from typing import Annotated

from pydantic import BaseModel, BeforeValidator, model_validator


def _empty_str_to_none(v: object) -> object:
    if isinstance(v, str) and not v:
        return None
    return v


NullableStr = Annotated[str | None, BeforeValidator(_empty_str_to_none)]


class BaseDto(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def strip_strings(cls, data: object) -> object:
        if isinstance(data, dict):
            return {k: v.strip() if isinstance(v, str) else v for k, v in data.items()}
        return data
