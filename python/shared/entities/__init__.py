from sqlalchemy.orm import DeclarativeBase


class BaseEntity(DeclarativeBase):
    pass


from .discord import Discord
from .guild import Guild
from .lol_stat import Champion, LolStat
from .manager import Manager as Manager
from .manager import Role as Role
from .member import Member
from .position import Position
from .preset import Preset, Statistics
from .preset_member import PresetMember
from .preset_member_position import PresetMemberPosition
from .tier import Tier
from .user import User
from .val_stat import Agent, ValStat


__all__ = [
    "Agent",
    "BaseEntity",
    "Champion",
    "Discord",
    "Guild",
    "Manager",
    "Role",
    "LolStat",
    "Member",
    "Position",
    "Preset",
    "PresetMember",
    "PresetMemberPosition",
    "Statistics",
    "Tier",
    "User",
    "ValStat",
]
