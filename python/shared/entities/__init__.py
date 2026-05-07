from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    __abstract__ = True

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


from .billing import Billing
from .guild import Guild
from .member import Member
from .payment import Payment
from .position import Position
from .preset import Preset
from .preset_member import PresetMember
from .preset_member_position import PresetMemberPosition
from .subscription import Subscription
from .tier import Tier
from .user import User


__all__ = [
    "Base",
    "Billing",
    "Guild",
    "Member",
    "Payment",
    "Position",
    "Preset",
    "PresetMember",
    "PresetMemberPosition",
    "Subscription",
    "Tier",
    "User",
]
