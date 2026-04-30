from pydantic import Field, model_validator

from ..utils.error import HTTPError, ValidationErrorCode
from . import BaseDTO, BigInt, NameStr
from .preset_member import PresetMemberDetailDTO


class PresetDTO(BaseDTO):
    preset_id: int
    guild_id: BigInt
    name: str
    points: int
    timer: int
    team_size: int
    point_scale: int


class PresetDetailDTO(PresetDTO):
    preset_members: list[PresetMemberDetailDTO]


class CreatePresetDTO(BaseDTO):
    name: NameStr
    points: int = Field(ge=0, le=10000)
    timer: int = Field(ge=1, le=60)
    team_size: int = Field(ge=1, le=10)
    point_scale: int = Field(ge=1, le=100)

    @model_validator(mode="after")
    def points_gte_team_size(self) -> CreatePresetDTO:
        if self.points < self.team_size:
            raise HTTPError(ValidationErrorCode.Invalid)
        return self


class UpdatePresetDTO(BaseDTO):
    name: NameStr | None = None
    points: int | None = Field(default=None, ge=0, le=10000)
    timer: int | None = Field(default=None, ge=1, le=60)
    team_size: int | None = Field(default=None, ge=1, le=10)
    point_scale: int | None = Field(default=None, ge=1, le=100)


class CopyPresetDTO(BaseDTO):
    target_guild_id: BigInt
