from . import BaseDTO, NullableStr


class TierDTO(BaseDTO):
    tier_id: int
    preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AddTierDTO(BaseDTO):
    name: str


class UpdateTierDTO(BaseDTO):
    name: NullableStr = None
