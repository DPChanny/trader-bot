from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .discord import Discord
    from .guild import Guild
    from .lol_stat import LolStat
    from .preset_member import PresetMember
    from .val_stat import ValStat


class Role(enum.IntEnum):
    VIEWER = 0
    EDITOR = 1
    ADMIN = 2
    OWNER = 3


class Member(BaseEntity):
    __tablename__ = "member"
    __table_args__ = (UniqueConstraint("guild_id", "discord_id"),)

    member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        ForeignKey("guild.guild_id", ondelete="CASCADE"),
        nullable=False,
    )
    discord_id: Mapped[str] = mapped_column(
        ForeignKey("discord.discord_id"),
        nullable=False,
    )
    riot_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    alias: Mapped[str | None] = mapped_column(String(256), nullable=True)
    avatar_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    role: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    discord: Mapped[Discord] = relationship("Discord", back_populates="members")
    guild: Mapped[Guild] = relationship("Guild", back_populates="members")

    preset_members: Mapped[list[PresetMember]] = relationship(
        "PresetMember", back_populates="member", cascade="all, delete-orphan"
    )
    lol_stat: Mapped[LolStat | None] = relationship(
        "LolStat",
        back_populates="member",
        uselist=False,
        cascade="all, delete-orphan",
    )
    val_stat: Mapped[ValStat | None] = relationship(
        "ValStat",
        back_populates="member",
        uselist=False,
        cascade="all, delete-orphan",
    )
