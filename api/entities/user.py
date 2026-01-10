from __future__ import annotations

from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..utils.database import Base

if TYPE_CHECKING:
    from .preset_user import PresetUser
    from .lol_stat import LolStat
    from .val_stat import ValStat


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False, unique=True)
    riot_id: Mapped[str] = mapped_column(String(256), nullable=False)
    discord_id: Mapped[str] = mapped_column(String(256), nullable=False)

    preset_users: Mapped[List[PresetUser]] = relationship(
        "PresetUser", back_populates="user", cascade="all, delete-orphan"
    )
    lol_stat: Mapped[Optional[LolStat]] = relationship(
        "LolStat",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    val_stat: Mapped[Optional[ValStat]] = relationship(
        "ValStat",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
