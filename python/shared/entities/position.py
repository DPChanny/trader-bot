from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..utils.entity import BaseEntity


if TYPE_CHECKING:
    from .preset import Preset
    from .preset_user_position import PresetUserPosition


class Position(BaseEntity):
    __tablename__ = "position"

    position_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    icon_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    preset: Mapped[Preset] = relationship("Preset", back_populates="positions")
    preset_user_positions: Mapped[list[PresetUserPosition]] = relationship(
        "PresetUserPosition",
        back_populates="position",
        cascade="all, delete-orphan",
    )
