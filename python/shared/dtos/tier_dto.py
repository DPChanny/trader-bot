from pydantic import BaseModel

from .base_dto import BaseResponseDTO, NullableStr


class TierDTO(BaseModel):
    tier_id: int
    preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AddTierRequestDTO(BaseModel):
    preset_id: int
    name: str


class UpdateTierRequestDTO(BaseModel):
    name: NullableStr = None


class GetTierDetailResponseDTO(BaseResponseDTO[TierDTO]):
    pass


class GetTierListResponseDTO(BaseResponseDTO[list[TierDTO]]):
    pass
