from __future__ import annotations

import enum
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, SmallInteger
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .preset import Preset


class AuctionStatus(enum.IntEnum):
    WAITING = 0
    IN_PROGRESS = 1
    COMPLETED = 2


class Auction(BaseEntity):
    __tablename__ = "auction"

    auction_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )
    preset_id: Mapped[int] = mapped_column(
        ForeignKey("preset.preset_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    guild_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("guild.discord_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[int] = mapped_column(
        SmallInteger, nullable=False, default=AuctionStatus.WAITING
    )
    preset_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    state_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    preset: Mapped[Preset] = relationship("Preset")
    guild: Mapped[Guild] = relationship("Guild")
