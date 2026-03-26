from sqlalchemy.orm import DeclarativeBase


class BaseEntity(DeclarativeBase):
    pass


from .lol_stat import Champion, LolStat
from .manager import Manager
from .position import Position
from .preset import Preset, Statistics
from .preset_user import PresetUser
from .preset_user_position import PresetUserPosition
from .tier import Tier
from .user import User
from .val_stat import Agent, ValStat


__all__ = [
    "Agent",
    "BaseEntity",
    "Champion",
    "LolStat",
    "Manager",
    "Position",
    "Preset",
    "PresetUser",
    "PresetUserPosition",
    "Statistics",
    "Tier",
    "User",
    "ValStat",
]
