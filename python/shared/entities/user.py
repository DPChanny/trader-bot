from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


if TYPE_CHECKING:
    from .lol_stat import LolStat
    from .preset_user import PresetUser
    from .val_stat import ValStat


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    alias: Mapped[str | None] = mapped_column(String(256), nullable=True)
    riot_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    discord_id: Mapped[str | None] = mapped_column(String(256), nullable=True)

    preset_users: Mapped[list[PresetUser]] = relationship(
        "PresetUser", back_populates="user", cascade="all, delete-orphan"
    )
    lol_stat: Mapped[LolStat | None] = relationship(
        "LolStat",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    val_stat: Mapped[ValStat | None] = relationship(
        "ValStat",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
