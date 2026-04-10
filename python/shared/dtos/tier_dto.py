from . import BaseDTO, NullableStr


class TierDTO(BaseDTO):
    tier_id: int
    preset_id: int
    name: str
    icon_url: str | None

    model_config = {"from_attributes": True}


class AddTierDTO(BaseDTO):
    name: str
    icon_url: NullableStr


class UpdateTierDTO(BaseDTO):
    name: NullableStr = None
    icon_url: NullableStr = None
