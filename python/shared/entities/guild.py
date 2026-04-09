from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .member import Member
    from .preset import Preset


class Guild(BaseEntity):
    __tablename__ = "guild"

    discord_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    icon_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)

    presets: Mapped[list[Preset]] = relationship(
        "Preset",
        back_populates="guild",
        cascade="all, delete-orphan",
    )
    members: Mapped[list[Member]] = relationship(
        "Member",
        back_populates="guild",
        cascade="all, delete-orphan",
    )
