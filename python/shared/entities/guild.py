from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild_manager import GuildManager
    from .preset import Preset
    from .user import User


class Guild(BaseEntity):
    __tablename__ = "guild"

    guild_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    discord_id: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)

    guild_managers: Mapped[list[GuildManager]] = relationship(
        "GuildManager",
        back_populates="guild",
        cascade="all, delete-orphan",
    )
    presets: Mapped[list[Preset]] = relationship(
        "Preset",
        back_populates="guild",
        cascade="all, delete-orphan",
    )
    users: Mapped[list[User]] = relationship(
        "User",
        back_populates="guild",
        cascade="all, delete-orphan",
    )
