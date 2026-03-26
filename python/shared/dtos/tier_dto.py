from . import BaseDto, NullableStr


class TierDTO(BaseDto):
    tier_id: int
    preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AddTierDTO(BaseDto):
    preset_id: int
    name: str


class UpdateTierDTO(BaseDto):
    name: NullableStr = None
