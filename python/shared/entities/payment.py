from sqlalchemy import ForeignKey, Integer, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from . import BaseEntity


class Payment(BaseEntity):
    __tablename__ = "payment"

    payment_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscription.subscription_id", ondelete="CASCADE")
    )
    order_id: Mapped[str] = mapped_column(String(64), unique=True)
    payment_key: Mapped[str] = mapped_column(String(255))
    amount: Mapped[int] = mapped_column(Integer)
    tier: Mapped[int] = mapped_column(SmallInteger)
