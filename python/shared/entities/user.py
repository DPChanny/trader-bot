from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


if TYPE_CHECKING:
    from .billing import Billing
    from .member import Member
    from .payment import Payment


class User(Base):
    __tablename__ = "user"

    discord_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    avatar_hash: Mapped[str | None] = mapped_column(String(64))
    customer_key: Mapped[str] = mapped_column(
        String(36), unique=True, server_default=text("gen_random_uuid()::text")
    )

    members: Mapped[list[Member]] = relationship("Member", viewonly=True)
    billings: Mapped[list[Billing]] = relationship("Billing", viewonly=True)
    payments: Mapped[list[Payment]] = relationship("Payment", viewonly=True)
