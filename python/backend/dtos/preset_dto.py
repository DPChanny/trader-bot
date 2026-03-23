
from pydantic import BaseModel

from entities.preset import Statistics

from .base_dto import BaseResponseDTO
from .position_dto import PositionDTO
from .preset_user_dto import PresetUserDetailDTO
from .tier_dto import TierDTO


class PresetDTO(BaseModel):
    preset_id: int
    name: str
    points: int
    time: int
    point_scale: int
    statistics: Statistics

    model_config = {"from_attributes": True}


class PresetDetailDTO(PresetDTO):
    preset_users: list[PresetUserDetailDTO] = []
    tiers: list[TierDTO] = []
    positions: list[PositionDTO] = []

    @classmethod
    def model_validate(cls, obj, **kwargs):
        preset_users = []
        if hasattr(obj, "preset_users") and obj.preset_users:
            preset_users = [
                PresetUserDetailDTO.model_validate(pu)
                for pu in obj.preset_users
            ]

        data = {
            "preset_id": obj.preset_id,
            "name": obj.name,
            "points": obj.points,
            "time": obj.time,
            "point_scale": obj.point_scale,
            "statistics": obj.statistics,
            "preset_users": preset_users,
            "tiers": obj.tiers if hasattr(obj, "tiers") and obj.tiers else [],
            "positions": (
                obj.positions
                if hasattr(obj, "positions") and obj.positions
                else []
            ),
        }
        return super().model_validate(data, **kwargs)


class AddPresetRequestDTO(BaseModel):
    name: str
    points: int
    time: int
    point_scale: int
    statistics: Statistics = Statistics.NONE


class UpdatePresetRequestDTO(BaseModel):
    name: str | None = None
    points: int | None = None
    time: int | None = None
    point_scale: int | None = None
    statistics: Statistics | None = None


class GetPresetDetailResponseDTO(BaseResponseDTO[PresetDetailDTO]):
    pass


class GetPresetListResponseDTO(BaseResponseDTO[list[PresetDTO]]):
    pass
