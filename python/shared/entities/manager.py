from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, SmallInteger, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .user import User


class Role(enum.IntEnum):
    VIEWER = 0
    EDITOR = 1
    ADMIN = 2


class Manager(BaseEntity):
    __tablename__ = "manager"
    __table_args__ = (UniqueConstraint("guild_id", "user_id"),)

    manager_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        ForeignKey("guild.guild_id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    guild: Mapped[Guild] = relationship("Guild", back_populates="managers")
    user: Mapped[User] = relationship("User", back_populates="managers")
