from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .billing import Billing
    from .guild import Guild


class Subscription(BaseEntity):
    __tablename__ = "subscription"

    subscription_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("guild.discord_id", ondelete="CASCADE"), unique=True
    )
    billing_id: Mapped[int | None] = mapped_column(
        ForeignKey("billing.billing_id", ondelete="SET NULL")
    )
    tier: Mapped[int] = mapped_column(SmallInteger)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    guild: Mapped[Guild] = relationship("Guild", viewonly=True)
    billing: Mapped[Billing | None] = relationship("Billing", viewonly=True)
