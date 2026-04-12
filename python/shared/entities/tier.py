from __future__ import annotations

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from . import BaseEntity


class Tier(BaseEntity):
    __tablename__ = "tier"

    tier_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
    )
    name: Mapped[str] = mapped_column(String(256))
    icon_url: Mapped[str | None] = mapped_column(String(2048))
