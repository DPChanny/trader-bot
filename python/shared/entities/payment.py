from sqlalchemy import BigInteger, ForeignKey, Integer, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from . import BaseEntity


class Payment(BaseEntity):
    __tablename__ = "payment"

    payment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscription.subscription_id", ondelete="CASCADE")
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("user.discord_id", ondelete="CASCADE")
    )
    order_id: Mapped[str] = mapped_column(String(64), unique=True)
    payment_key: Mapped[str] = mapped_column(Text)
    amount: Mapped[int] = mapped_column(Integer)
    tier: Mapped[int] = mapped_column(SmallInteger)
