from pydantic import BaseModel

from .position_dto import PositionDTO
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
    positions: list[PresetUserPositionDetailDTO] = []

    @classmethod
    def model_validate(cls, obj, **kwargs):
        positions = []
        if hasattr(obj, "preset_user_positions") and obj.preset_user_positions:
            positions = [
                PresetUserPositionDetailDTO(
                    preset_user_position_id=pup.preset_user_position_id,
                    preset_user_id=pup.preset_user_id,
                    position_id=pup.position_id,
                    position=PositionDTO.model_validate(pup.position),
                )
                for pup in obj.preset_user_positions
            ]

        data = {
            "preset_user_id": obj.preset_user_id,
            "preset_id": obj.preset_id,
            "user_id": obj.user_id,
            "tier_id": obj.tier_id if hasattr(obj, "tier_id") else None,
            "is_leader": obj.is_leader,
            "user": obj.user if hasattr(obj, "user") and obj.user else None,
            "tier": obj.tier if hasattr(obj, "tier") and obj.tier else None,
            "positions": positions,
        }
        return super().model_validate(data, **kwargs)


class AddPresetUserRequestDTO(BaseModel):
    preset_id: int
    user_id: int
    tier_id: int | None = None
    is_leader: bool = False


class UpdatePresetUserRequestDTO(BaseModel):
    tier_id: int | None = None
    is_leader: bool | None = None
