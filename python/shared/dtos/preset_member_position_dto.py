from . import BaseDTO


class PresetMemberPositionDTO(BaseDTO):
    preset_member_position_id: int
    preset_member_id: int
    position_id: int

    model_config = {"from_attributes": True}


class AddPresetMemberPositionDTO(BaseDTO):
    position_id: int
