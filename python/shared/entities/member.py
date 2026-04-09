from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, SmallInteger, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .discord_user import DiscordUser
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
    __table_args__ = (UniqueConstraint("guild_id", "discord_user_id"),)

    member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("guild.discord_id", ondelete="CASCADE"),
        nullable=False,
    )
    discord_user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("discord_user.discord_id"),
        nullable=False,
    )
    riot_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    alias: Mapped[str | None] = mapped_column(String(256), nullable=True)
    avatar_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    role: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    discord_user: Mapped[DiscordUser] = relationship(
        "DiscordUser", back_populates="members"
    )
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
