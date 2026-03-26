from . import BaseDto
from .position_dto import PositionDTO


class PresetMemberPositionDTO(BaseDto):
    preset_member_position_id: int
    preset_member_id: int
    position_id: int

    model_config = {"from_attributes": True}


class PresetMemberPositionDetailDTO(PresetMemberPositionDTO):
    position: PositionDTO


class AddPresetMemberPositionDTO(BaseDto):
    position_id: int
