from . import BaseDTO, NameStr, NullableNameStr, NullableUrlStr


class PositionDTO(BaseDTO):
    position_id: int
    preset_id: int
    name: str
    icon_url: str | None

    model_config = {"from_attributes": True}


class AddPositionDTO(BaseDTO):
    name: NameStr
    icon_url: NullableUrlStr


class UpdatePositionDTO(BaseDTO):
    name: NullableNameStr = None
    icon_url: NullableUrlStr = None
