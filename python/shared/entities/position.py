from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


if TYPE_CHECKING:
    from .preset import Preset
    from .preset_member_position import PresetMemberPosition


class Position(Base):
    __tablename__ = "position"

    position_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(256))
    icon_url: Mapped[str | None] = mapped_column(String(2048))

    preset: Mapped[Preset] = relationship("Preset", viewonly=True)
    preset_member_positions: Mapped[list[PresetMemberPosition]] = relationship(
        "PresetMemberPosition", viewonly=True
    )
