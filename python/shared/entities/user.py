from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .manager import Manager


class User(BaseEntity):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    discord_id: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(String(512), nullable=True)

    managers: Mapped[list[Manager]] = relationship(
        "Manager", back_populates="user", cascade="all, delete-orphan"
    )
