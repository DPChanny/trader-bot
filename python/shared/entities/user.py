from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..utils.entity import BaseEntity


if TYPE_CHECKING:
    from .lol_stat import LolStat
    from .manager import Manager
    from .preset_user import PresetUser
    from .val_stat import ValStat


class User(BaseEntity):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    manager_id: Mapped[int] = mapped_column(
        ForeignKey("manager.manager_id", ondelete="CASCADE"),
        nullable=False,
    )
    alias: Mapped[str | None] = mapped_column(String(256), nullable=True)
    riot_id: Mapped[str | None] = mapped_column(String(256), nullable=True)
    discord_id: Mapped[str | None] = mapped_column(String(256), nullable=True)

    manager: Mapped[Manager] = relationship("Manager", back_populates="users")

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
