from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .member import Member
    from .preset import Preset


class Guild(BaseEntity):
    __tablename__ = "guild"

    guild_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    discord_id: Mapped[str] = mapped_column(String(256), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    icon_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

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
