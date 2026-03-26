from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .member import Member


class LolStat(BaseEntity):
    __tablename__ = "lol_stat"

    lol_stat_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    member_id: Mapped[int] = mapped_column(
        ForeignKey("member.member_id", ondelete="CASCADE"), unique=True, index=True
    )
    tier: Mapped[str] = mapped_column(String(50), nullable=False)
    rank: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    lp: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    member: Mapped[Member] = relationship("Member", back_populates="lol_stat")
    champions: Mapped[list[Champion]] = relationship(
        "Champion", back_populates="lol_stat", cascade="all, delete-orphan"
    )


class Champion(BaseEntity):
    __tablename__ = "champion"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    lol_stat_id: Mapped[int] = mapped_column(
        ForeignKey("lol_stat.lol_stat_id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon_url: Mapped[str] = mapped_column(String(500), nullable=False)
    games: Mapped[int] = mapped_column(Integer, nullable=False)
    win_rate: Mapped[float] = mapped_column(Float, nullable=False)
    rank_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    lol_stat: Mapped[LolStat] = relationship("LolStat", back_populates="champions")
