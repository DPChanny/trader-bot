from pydantic import BaseModel

from .preset_user_position_dto import PresetUserPositionDetailDTO
from .tier_dto import TierDTO
from .user_dto import UserDTO


class PresetUserDTO(BaseModel):
    preset_user_id: int
    preset_id: int
    user_id: int
    tier_id: int | None = None
    is_leader: bool = False

    model_config = {"from_attributes": True}


class PresetUserDetailDTO(PresetUserDTO):
    user: UserDTO | None = None
    tier: TierDTO | None = None
    preset_user_positions: list[PresetUserPositionDetailDTO] = []


class AddPresetUserDTO(BaseModel):
    preset_id: int
    user_id: int
    tier_id: int | None = None
    is_leader: bool = False


class UpdatePresetUserDTO(BaseModel):
    tier_id: int | None = None
    is_leader: bool | None = None
