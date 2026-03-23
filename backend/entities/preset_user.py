from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base


if TYPE_CHECKING:
    from .preset import Preset
    from .preset_user_position import PresetUserPosition
    from .tier import Tier
    from .user import User


class PresetUser(Base):
    __tablename__ = "preset_user"

    preset_user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    tier_id: Mapped[int | None] = mapped_column(
        ForeignKey("tier.tier_id", ondelete="SET NULL"),
        nullable=True,
    )
    is_leader: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    preset: Mapped[Preset] = relationship("Preset", back_populates="preset_users")
    user: Mapped[User] = relationship("User", back_populates="preset_users")
    tier: Mapped[Tier | None] = relationship("Tier", back_populates="preset_users")
    preset_user_positions: Mapped[list[PresetUserPosition]] = relationship(
        "PresetUserPosition",
        back_populates="preset_user",
        cascade="all, delete-orphan",
    )
