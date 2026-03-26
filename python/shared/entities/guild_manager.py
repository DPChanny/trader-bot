from __future__ import annotations

import enum
from typing import TYPE_CHECKING

from sqlalchemy import Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .manager import Manager


class GuildRole(enum.Enum):
    OWNER = "OWNER"
    ADMIN = "ADMIN"
    EDITOR = "EDITOR"
    VIEWER = "VIEWER"


_ROLE_ORDER = {
    GuildRole.VIEWER: 0,
    GuildRole.EDITOR: 1,
    GuildRole.ADMIN: 2,
    GuildRole.OWNER: 3,
}


def guild_role_gte(role: GuildRole, min_role: GuildRole) -> bool:
    return _ROLE_ORDER[role] >= _ROLE_ORDER[min_role]


class GuildManager(BaseEntity):
    __tablename__ = "guild_manager"
    __table_args__ = (UniqueConstraint("guild_id", "manager_id"),)

    guild_manager_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        ForeignKey("guild.guild_id", ondelete="CASCADE"),
        nullable=False,
    )
    manager_id: Mapped[int] = mapped_column(
        ForeignKey("manager.manager_id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[GuildRole] = mapped_column(Enum(GuildRole), nullable=False)

    guild: Mapped[Guild] = relationship("Guild", back_populates="guild_managers")
    manager: Mapped[Manager] = relationship("Manager", back_populates="guild_managers")
