from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .preset import Preset
    from .user import User


class Manager(BaseEntity):
    __tablename__ = "manager"

    manager_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    discord_id: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    refresh_token: Mapped[str | None] = mapped_column(String(512), nullable=True)

    presets: Mapped[list[Preset]] = relationship(
        "Preset", back_populates="manager", cascade="all, delete-orphan"
    )
    users: Mapped[list[User]] = relationship(
        "User", back_populates="manager", cascade="all, delete-orphan"
    )
