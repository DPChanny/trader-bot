from __future__ import annotations

from sqlalchemy import BigInteger, String
from sqlalchemy.orm import Mapped, mapped_column

from . import BaseEntity


class User(BaseEntity):
    __tablename__ = "user"

    discord_id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    name: Mapped[str] = mapped_column(String(256))
    avatar_hash: Mapped[str | None] = mapped_column(String(64))
