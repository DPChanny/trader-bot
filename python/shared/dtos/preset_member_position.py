from . import BaseDTO
from .position import PositionDTO


class PresetMemberPositionDTO(BaseDTO):
    preset_member_position_id: int
    preset_member_id: int
    position_id: int


class PresetMemberPositionDetailDTO(PresetMemberPositionDTO):
    position: PositionDTO


class AddPresetMemberPositionDTO(BaseDTO):
    position_id: int
