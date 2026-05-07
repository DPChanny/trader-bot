from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import Base


if TYPE_CHECKING:
    from .member import Member
    from .payment import Payment
    from .preset import Preset
    from .subscription import Subscription


class Guild(Base):
    __tablename__ = "guild"

    discord_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    icon_hash: Mapped[str | None] = mapped_column(String(64))
    invite_channel_id: Mapped[int | None] = mapped_column(BigInteger)

    presets: Mapped[list[Preset]] = relationship("Preset", viewonly=True)
    members: Mapped[list[Member]] = relationship("Member", viewonly=True)
    subscription: Mapped[Subscription | None] = relationship(
        "Subscription", viewonly=True
    )
    payments: Mapped[list[Payment]] = relationship("Payment", viewonly=True)
