from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .preset import Preset
    from .preset_member_position import PresetMemberPosition


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
    preset_member_positions: Mapped[list[PresetMemberPosition]] = relationship(
        "PresetMemberPosition",
        back_populates="position",
        cascade="all, delete-orphan",
    )
