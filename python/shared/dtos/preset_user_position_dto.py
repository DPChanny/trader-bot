from pydantic import BaseModel

from .position_dto import PositionDTO


class PresetUserPositionDTO(BaseModel):
    preset_user_position_id: int
    preset_user_id: int
    position_id: int

    model_config = {"from_attributes": True}


class PresetUserPositionDetailDTO(PresetUserPositionDTO):
    position: PositionDTO


class AddPresetUserPositionDTO(BaseModel):
    preset_user_id: int
    position_id: int


class DeletePresetUserPositionDTO(BaseModel):
    preset_user_position_id: int
