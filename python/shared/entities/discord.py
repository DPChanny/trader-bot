from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .manager import Manager
    from .member import Member
    from .user import User


class Discord(BaseEntity):
    __tablename__ = "discord"

    discord_id: Mapped[str] = mapped_column(String(256), primary_key=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    avatar_hash: Mapped[str | None] = mapped_column(String(256), nullable=True)

    users: Mapped[list[User]] = relationship("User", back_populates="discord")
    managers: Mapped[list[Manager]] = relationship("Manager", back_populates="discord")
    members: Mapped[list[Member]] = relationship("Member", back_populates="discord")
