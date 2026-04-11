from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity

if TYPE_CHECKING:
    from .position import Position


class PresetMemberPosition(BaseEntity):
    __tablename__ = "preset_member_position"
    __table_args__ = (
        UniqueConstraint(
            "preset_member_id",
            "position_id",
            name="uq_preset_member_position",
        ),
    )

    preset_member_position_id: Mapped[int] = mapped_column(
        primary_key=True, autoincrement=True
    )
    preset_member_id: Mapped[int] = mapped_column(
        ForeignKey("preset_member.preset_member_id", ondelete="CASCADE"),
        nullable=False,
    )
    position_id: Mapped[int] = mapped_column(
        ForeignKey("position.position_id", ondelete="CASCADE"),
        nullable=False,
    )

    position: Mapped[Position] = relationship("Position", viewonly=True)
