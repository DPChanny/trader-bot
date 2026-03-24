from pydantic import BaseModel

from .base_dto import BaseResponseDTO, NullableStr


class PositionDTO(BaseModel):
    position_id: int
    preset_id: int
    name: str
    icon_url: str | None = None

    model_config = {"from_attributes": True}


class AddPositionRequestDTO(BaseModel):
    preset_id: int
    name: str
    icon_url: NullableStr = None


class UpdatePositionRequestDTO(BaseModel):
    name: NullableStr = None
    icon_url: NullableStr = None


class GetPositionDetailResponseDTO(BaseResponseDTO[PositionDTO]):
    pass


class GetPositionListResponseDTO(BaseResponseDTO[list[PositionDTO]]):
    pass
