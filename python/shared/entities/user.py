from __future__ import annotations

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from . import BaseEntity


class User(BaseEntity):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    discord_id: Mapped[str] = mapped_column(
        String(256),
        unique=True,
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    alias: Mapped[str | None] = mapped_column(String(256), nullable=True)
    avatar_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)
    refresh_token: Mapped[str | None] = mapped_column(String(512), nullable=True)
