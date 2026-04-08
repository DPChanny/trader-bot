from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .discord import Discord
    from .guild import Guild


class Role(enum.IntEnum):
    VIEWER = 0
    EDITOR = 1
    ADMIN = 2


class Manager(BaseEntity):
    __tablename__ = "manager"
    __table_args__ = (UniqueConstraint("guild_id", "discord_id"),)

    manager_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        ForeignKey("guild.guild_id", ondelete="CASCADE"),
        nullable=False,
    )
    discord_id: Mapped[str] = mapped_column(
        String(256),
        ForeignKey("discord.discord_id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    guild: Mapped[Guild] = relationship("Guild", back_populates="managers")
    discord: Mapped[Discord] = relationship("Discord", back_populates="managers")
