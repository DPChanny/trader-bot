from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, ForeignKey, SmallInteger, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from . import BaseEntity


if TYPE_CHECKING:
    from .guild import Guild
    from .position import Position
    from .preset_member import PresetMember
    from .tier import Tier


class Preset(BaseEntity):
    __tablename__ = "preset"

    preset_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    guild_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("guild.discord_id", ondelete="CASCADE")
    )
    name: Mapped[str] = mapped_column(String(256))
    points: Mapped[int] = mapped_column(SmallInteger)
    timer: Mapped[int] = mapped_column(SmallInteger)
    team_size: Mapped[int] = mapped_column(SmallInteger)
    point_scale: Mapped[int] = mapped_column(SmallInteger)
    guild: Mapped[Guild] = relationship("Guild", viewonly=True)

    tiers: Mapped[list[Tier]] = relationship("Tier", viewonly=True)
    positions: Mapped[list[Position]] = relationship("Position", viewonly=True)
    preset_members: Mapped[list[PresetMember]] = relationship(
        "PresetMember", viewonly=True
    )
