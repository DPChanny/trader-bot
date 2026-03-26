from . import BaseDto, NullableStr


class TierDTO(BaseDto):
    tier_id: int
    preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AddTierDTO(BaseDto):
    name: str


class UpdateTierDTO(BaseDto):
    name: NullableStr = None
