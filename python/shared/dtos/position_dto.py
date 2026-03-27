from . import BaseDTO, NullableStr


class PositionDTO(BaseDTO):
    position_id: int
    preset_id: int
    name: str
    icon_url: str | None = None

    model_config = {"from_attributes": True}


class AddPositionDTO(BaseDTO):
    preset_id: int
    name: str
    icon_url: NullableStr = None


class UpdatePositionDTO(BaseDTO):
    name: NullableStr = None
    icon_url: NullableStr = None
