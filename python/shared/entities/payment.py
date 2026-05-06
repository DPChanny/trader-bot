from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .user import User


class Payment(BaseEntity):
    __tablename__ = "payment"

    payment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("guild.discord_id", ondelete="SET NULL")
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("user.discord_id", ondelete="CASCADE")
    )
    order_id: Mapped[str] = mapped_column(String(64), unique=True)
    payment_key: Mapped[str | None] = mapped_column(Text)
    plan: Mapped[int] = mapped_column(SmallInteger)

    guild: Mapped[Guild | None] = relationship("Guild", viewonly=True)
    user: Mapped[User] = relationship("User", viewonly=True)
