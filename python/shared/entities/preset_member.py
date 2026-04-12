from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .member import Member
    from .preset_member_position import PresetMemberPosition
    from .tier import Tier


class PresetMember(BaseEntity):
    __tablename__ = "preset_member"

    preset_member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("member.member_id", ondelete="CASCADE"),
    )
    tier_id: Mapped[int | None] = mapped_column(
        ForeignKey("tier.tier_id", ondelete="SET NULL"),
    )
    is_leader: Mapped[bool] = mapped_column(Boolean)

    member: Mapped[Member] = relationship("Member", viewonly=True)
    tier: Mapped[Tier | None] = relationship("Tier", viewonly=True)
    preset_member_positions: Mapped[list[PresetMemberPosition]] = relationship(
        "PresetMemberPosition",
        viewonly=True,
    )
