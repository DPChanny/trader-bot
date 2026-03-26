from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .manager import Manager
    from .position import Position
    from .preset_user import PresetUser
    from .tier import Tier


class Statistics(enum.Enum):
    NONE = "NONE"
    LOL = "LOL"
    VAL = "VAL"


class Preset(BaseEntity):
    __tablename__ = "preset"

    preset_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    manager_id: Mapped[int] = mapped_column(
        ForeignKey("manager.manager_id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    points: Mapped[int] = mapped_column(nullable=False)
    time: Mapped[int] = mapped_column(nullable=False)
    point_scale: Mapped[int] = mapped_column(nullable=False)
    statistics: Mapped[Statistics] = mapped_column(
        Enum(Statistics), nullable=False, default=Statistics.NONE
    )

    manager: Mapped[Manager] = relationship("Manager", back_populates="presets")

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
    preset_users: Mapped[list[PresetUser]] = relationship(
        "PresetUser",
        back_populates="preset",
        cascade="all, delete-orphan",
    )
