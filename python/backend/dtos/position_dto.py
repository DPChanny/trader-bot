from pydantic import BaseModel

from shared.dtos.base_dto import BaseResponseDTO


class PositionDTO(BaseModel):
    position_id: int
    preset_id: int
    name: str
    icon_url: str | None = None

    model_config = {"from_attributes": True}


class AddPositionRequestDTO(BaseModel):
    preset_id: int
    name: str
    icon_url: str | None = None


class UpdatePositionRequestDTO(BaseModel):
    name: str | None = None
    icon_url: str | None = None


class GetPositionDetailResponseDTO(BaseResponseDTO[PositionDTO]):
    pass


class GetPositionListResponseDTO(BaseResponseDTO[list[PositionDTO]]):
    pass
