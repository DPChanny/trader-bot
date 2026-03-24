from pydantic import BaseModel

from .base_dto import NullableStr


class TierDTO(BaseModel):
    tier_id: int
    preset_id: int
    name: str

    model_config = {"from_attributes": True}


class AddTierDTO(BaseModel):
    preset_id: int
    name: str


class UpdateTierDTO(BaseModel):
    name: NullableStr = None
