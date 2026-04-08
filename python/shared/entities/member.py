from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .discord import Discord
    from .guild import Guild
    from .lol_stat import LolStat
    from .preset_member import PresetMember
    from .val_stat import ValStat


class Member(BaseEntity):
    __tablename__ = "member"

    member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        ForeignKey("guild.guild_id", ondelete="CASCADE"),
        nullable=False,
    )
    riot_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    discord_id: Mapped[str | None] = mapped_column(
        String(256),
        ForeignKey("discord.discord_id", ondelete="SET NULL"),
        nullable=True,
    )

    guild: Mapped[Guild] = relationship("Guild", back_populates="members")
    discord: Mapped[Discord | None] = relationship("Discord", back_populates="members")

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
