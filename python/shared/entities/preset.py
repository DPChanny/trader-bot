from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .position import Position
    from .preset_member import PresetMember
    from .tier import Tier


class Statistics(enum.Enum):
    NONE = "NONE"
    LOL = "LOL"
    VAL = "VAL"


class Preset(BaseEntity):
    __tablename__ = "preset"

    preset_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        ForeignKey("guild.guild_id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    points: Mapped[int] = mapped_column(nullable=False)
    time: Mapped[int] = mapped_column(nullable=False)
    point_scale: Mapped[int] = mapped_column(nullable=False)
    statistics: Mapped[Statistics] = mapped_column(
        Enum(Statistics), nullable=False, default=Statistics.NONE
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
