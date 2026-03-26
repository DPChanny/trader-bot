from ..entities.preset import Statistics
from . import BaseDto, NullableStr
from .position_dto import PositionDTO
from .preset_member_dto import PresetMemberDetailDTO
from .tier_dto import TierDTO


class PresetDTO(BaseDto):
    preset_id: int
    guild_id: int
    name: str
    points: int
    time: int
    point_scale: int
    statistics: Statistics

    model_config = {"from_attributes": True}


class PresetDetailDTO(PresetDTO):
    preset_members: list[PresetMemberDetailDTO] = []
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
