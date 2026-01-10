from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from ..utils.database import Base


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False, unique=True)
    riot_id: Mapped[str] = mapped_column(String(256), nullable=False)
    discord_id: Mapped[str] = mapped_column(String(256), nullable=False)
