from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .discord import Discord


class User(BaseEntity):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    discord_id: Mapped[str] = mapped_column(
        String(256),
        ForeignKey("discord.discord_id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    refresh_token: Mapped[str | None] = mapped_column(String(512), nullable=True)

    discord: Mapped[Discord] = relationship("Discord", back_populates="users")
