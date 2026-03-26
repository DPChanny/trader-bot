from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .member import Member
    from .preset import Preset
    from .preset_member_position import PresetMemberPosition
    from .tier import Tier


class PresetMember(BaseEntity):
    __tablename__ = "preset_member"

    preset_member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("member.member_id", ondelete="CASCADE"),
        nullable=False,
    )
    tier_id: Mapped[int | None] = mapped_column(
        ForeignKey("tier.tier_id", ondelete="SET NULL"),
        nullable=True,
    )
    is_leader: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    preset: Mapped[Preset] = relationship("Preset", back_populates="preset_members")
    member: Mapped[Member] = relationship("Member", back_populates="preset_members")
    tier: Mapped[Tier | None] = relationship("Tier", back_populates="preset_members")
    preset_member_positions: Mapped[list[PresetMemberPosition]] = relationship(
        "PresetMemberPosition",
        back_populates="preset_member",
        cascade="all, delete-orphan",
    )
