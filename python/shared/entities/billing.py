from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


if TYPE_CHECKING:
    from .subscription import Subscription
    from .user import User


class Billing(Base):
    __tablename__ = "billing"

    billing_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("user.discord_id", ondelete="CASCADE")
    )
    billing_key: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(String(32))

    user: Mapped[User] = relationship("User", viewonly=True)
    subscription: Mapped[Subscription | None] = relationship(
        "Subscription", viewonly=True
    )
