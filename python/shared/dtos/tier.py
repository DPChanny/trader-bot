from . import BaseDTO, BaseEntityDTO, NameStr, NullableUrlStr


class TierDTO(BaseEntityDTO):
    tier_id: int
    preset_id: int
    name: str
    icon_url: str | None


class AddTierDTO(BaseDTO):
    name: NameStr
    icon_url: NullableUrlStr


class UpdateTierDTO(BaseDTO):
    name: NameStr | None = None
    icon_url: NullableUrlStr = None
