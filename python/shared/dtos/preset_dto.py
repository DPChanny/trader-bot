from . import BaseDto, NullableStr

from ..entities.preset import Statistics
from .position_dto import PositionDTO
from .preset_user_dto import PresetUserDetailDTO
from .tier_dto import TierDTO


class PresetDTO(BaseDto):
    preset_id: int
    name: str
    points: int
    time: int
    point_scale: int
    statistics: Statistics

    model_config = {"from_attributes": True}


class PresetDetailDTO(PresetDTO):
    preset_users: list[PresetUserDetailDTO] = []
    tiers: list[TierDTO] = []
    positions: list[PositionDTO] = []


class AddPresetDTO(BaseDto):
    name: str
    points: int
    time: int
    point_scale: int
    statistics: Statistics = Statistics.NONE


class UpdatePresetDTO(BaseDto):
    name: NullableStr = None
    points: int | None = None
    time: int | None = None
    point_scale: int | None = None
    statistics: Statistics | None = None
