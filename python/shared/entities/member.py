from typing import TYPE_CHECKING

from sqlalchemy import (
    BigInteger,
    ForeignKey,
    Index,
    SmallInteger,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .preset_member import PresetMember
    from .user import User


class Member(BaseEntity):
    __tablename__ = "member"
    __table_args__ = (
        UniqueConstraint("guild_id", "user_id"),
        Index("ix_member_guild_id", "guild_id"),
        Index("ix_member_user_id", "user_id"),
    )

    member_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("guild.discord_id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("user.discord_id", ondelete="CASCADE")
    )
    name: Mapped[str | None] = mapped_column(String(256))
    alias: Mapped[str | None] = mapped_column(String(256))
    avatar_hash: Mapped[str | None] = mapped_column(String(64))
    info_url: Mapped[str | None] = mapped_column(String(2048))
    role: Mapped[int] = mapped_column(SmallInteger)

    user: Mapped[User] = relationship("User", viewonly=True)
    guild: Mapped[Guild] = relationship("Guild", viewonly=True)
    preset_members: Mapped[list[PresetMember]] = relationship(
        "PresetMember", viewonly=True
    )
