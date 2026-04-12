from . import BaseDTO, NameStr, NullableUrlStr


class TierDTO(BaseDTO):
    tier_id: int
    preset_id: int
    name: str
    icon_url: str | None

    model_config = {"from_attributes": True}


class AddTierDTO(BaseDTO):
    name: NameStr
    icon_url: NullableUrlStr


class UpdateTierDTO(BaseDTO):
    name: NameStr | None = None
    icon_url: NullableUrlStr = None
