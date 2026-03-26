from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .preset import Preset
    from .preset_member import PresetMember


class Tier(BaseEntity):
    __tablename__ = "tier"

    tier_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)

    preset: Mapped[Preset] = relationship("Preset", back_populates="tiers")
    preset_members: Mapped[list[PresetMember]] = relationship(
        "PresetMember", back_populates="tier"
    )
