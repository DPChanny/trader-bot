from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from . import BaseEntity


class Subscription(BaseEntity):
    __tablename__ = "subscription"

    subscription_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("guild.discord_id", ondelete="CASCADE"), unique=True
    )
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.discord_id", ondelete="SET NULL")
    )
    tier: Mapped[int] = mapped_column(SmallInteger)
    status: Mapped[int] = mapped_column(SmallInteger)
    billing_key: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
