from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .position import Position
    from .preset_member import PresetMember
    from .tier import Tier


class Statistics(enum.IntEnum):
    NONE = 0
    LOL = 1
    VAL = 2


class Preset(BaseEntity):
    __tablename__ = "preset"

    preset_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("guild.discord_id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    points: Mapped[int] = mapped_column(nullable=False)
    timer: Mapped[int] = mapped_column(nullable=False)
    team_size: Mapped[int] = mapped_column(nullable=False)
    point_scale: Mapped[int] = mapped_column(nullable=False)
    statistics: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=Statistics.NONE
    )

    guild: Mapped[Guild] = relationship("Guild", back_populates="presets")

    tiers: Mapped[list[Tier]] = relationship(
        "Tier",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    positions: Mapped[list[Position]] = relationship(
        "Position",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
    preset_members: Mapped[list[PresetMember]] = relationship(
        "PresetMember",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
