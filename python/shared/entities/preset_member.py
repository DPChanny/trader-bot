from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


if TYPE_CHECKING:
    from .member import Member
    from .preset import Preset
    from .preset_member_position import PresetMemberPosition
    from .tier import Tier


class PresetMember(Base):
    __tablename__ = "preset_member"
    __table_args__ = (UniqueConstraint("preset_id", "member_id"),)

    preset_member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE")
    )
    member_id: Mapped[int] = mapped_column(
        ForeignKey("member.member_id", ondelete="CASCADE")
    )
    tier_id: Mapped[int | None] = mapped_column(
        ForeignKey("tier.tier_id", ondelete="SET NULL")
    )
    is_leader: Mapped[bool] = mapped_column(Boolean)
    info_url: Mapped[str | None] = mapped_column(String(2048))

    preset: Mapped[Preset] = relationship("Preset", viewonly=True)
    member: Mapped[Member] = relationship("Member", viewonly=True)
    tier: Mapped[Tier | None] = relationship("Tier", viewonly=True)
    preset_member_positions: Mapped[list[PresetMemberPosition]] = relationship(
        "PresetMemberPosition", viewonly=True
    )
