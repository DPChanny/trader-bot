from typing import Annotated

from pydantic import BaseModel, BeforeValidator


def _empty_str_to_none(v: object) -> object:
    if isinstance(v, str) and not v.strip():
        return None
    return v


NullableStr = Annotated[str | None, BeforeValidator(_empty_str_to_none)]
