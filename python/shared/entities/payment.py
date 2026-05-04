from sqlalchemy import BigInteger, ForeignKey, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from . import BaseEntity


class Payment(BaseEntity):
    __tablename__ = "payment"

    payment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscription_id: Mapped[int | None] = mapped_column(
        ForeignKey("subscription.subscription_id", ondelete="SET NULL"), nullable=True
    )
    user_id: Mapped[int | None] = mapped_column(
        BigInteger, ForeignKey("user.discord_id", ondelete="SET NULL"), nullable=True
    )
    order_id: Mapped[str] = mapped_column(String(64), unique=True)
    amount: Mapped[int] = mapped_column()
    tier: Mapped[int] = mapped_column(SmallInteger)
