from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import String, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from utils.database import Base


class LolStat(Base):
    """User's League of Legends game data"""

    __tablename__ = "lol_stat"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.user_id", ondelete="CASCADE"), unique=True, index=True
    )
    tier: Mapped[str] = mapped_column(String(50), nullable=False)
    rank: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    lp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    champions: Mapped[List[Champion]] = relationship(
        "Champion", back_populates="lol_stat", cascade="all, delete-orphan"
    )


class Champion(Base):
    """Top champions for a user's LOL data"""

    __tablename__ = "champion"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    lol_stat_id: Mapped[int] = mapped_column(
        ForeignKey("lol_stat.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon_url: Mapped[str] = mapped_column(String(500), nullable=False)
    games: Mapped[int] = mapped_column(Integer, nullable=False)
    win_rate: Mapped[float] = mapped_column(Float, nullable=False)
    rank_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    lol_stat: Mapped[LolStat] = relationship(
        "LolStat", back_populates="champions"
    )
