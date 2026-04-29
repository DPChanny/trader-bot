from typing import TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class CursorPageDTO[T](BaseModel):
    items: list[T]
    next_cursor: int | None
