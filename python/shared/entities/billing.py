from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .subscription import Subscription
    from .user import User


class Billing(BaseEntity):
    __tablename__ = "billing"

    billing_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    subscription_id: Mapped[int] = mapped_column(
        ForeignKey("subscription.subscription_id", ondelete="CASCADE"), unique=True
    )
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("user.discord_id", ondelete="CASCADE")
    )
    billing_key: Mapped[str] = mapped_column(Text)

    subscription: Mapped[Subscription] = relationship("Subscription", viewonly=True)
    user: Mapped[User] = relationship("User", viewonly=True)
