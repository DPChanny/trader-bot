from pydantic import BaseModel

from shared.utils.types import NullableStr


class PositionDTO(BaseModel):
    position_id: int
    preset_id: int
    name: str
    icon_url: str | None = None

    model_config = {"from_attributes": True}


class AddPositionDTO(BaseModel):
    preset_id: int
    name: str
    icon_url: NullableStr = None


class UpdatePositionDTO(BaseModel):
    name: NullableStr = None
    icon_url: NullableStr = None
