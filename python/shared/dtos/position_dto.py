from ..utils.dto import BaseDto, NullableStr


class PositionDTO(BaseDto):
    position_id: int
    preset_id: int
    name: str
    icon_url: str | None = None

    model_config = {"from_attributes": True}


class AddPositionDTO(BaseDto):
    preset_id: int
    name: str
    icon_url: NullableStr = None


class UpdatePositionDTO(BaseDto):
    name: NullableStr = None
    icon_url: NullableStr = None
