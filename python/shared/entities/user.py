from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .discord_user import DiscordUser


class User(BaseEntity):
    __tablename__ = "user"

    discord_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("discord_user.discord_id"),
        primary_key=True,
    )
    refresh_token: Mapped[str | None] = mapped_column(String(512), nullable=True)

    discord_user: Mapped[DiscordUser] = relationship(
        "DiscordUser",
        foreign_keys=[discord_id],
        viewonly=True,
    )
