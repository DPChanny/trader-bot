from ..utils.dto import BaseDto
from .position_dto import PositionDTO


class PresetUserPositionDTO(BaseDto):
    preset_user_position_id: int
    preset_user_id: int
    position_id: int

    model_config = {"from_attributes": True}


class PresetUserPositionDetailDTO(PresetUserPositionDTO):
    position: PositionDTO


class AddPresetUserPositionDTO(BaseDto):
    preset_user_id: int
    position_id: int


class DeletePresetUserPositionDTO(BaseDto):
    preset_user_position_id: int
