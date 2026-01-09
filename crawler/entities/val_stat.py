from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base


class ValStat(Base):
    """User's Valorant game data"""

    __tablename__ = "val_stat"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"), unique=True, index=True
    )
    tier: Mapped[str] = mapped_column(String(50), nullable=False)
    rank: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    # Relationships
    agents: Mapped[List[ValAgent]] = relationship(
        "ValAgent", back_populates="val_stat", cascade="all, delete-orphan"
    )


class ValAgent(Base):
    """Top agents for a user's Valorant data"""

    __tablename__ = "val_agent"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    val_stat_id: Mapped[int] = mapped_column(
        ForeignKey("val_stat.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon_url: Mapped[str] = mapped_column(String(500), nullable=False)
    games: Mapped[int] = mapped_column(Integer, nullable=False)
    win_rate: Mapped[float] = mapped_column(Float, nullable=False)
    rank_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Relationships
    val_stat: Mapped[ValStat] = relationship("ValStat", back_populates="agents")
