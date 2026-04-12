from pydantic import Field

from . import BaseDTO, DiscordId, NameStr
from .preset_member_dto import PresetMemberDetailDTO


class PresetDTO(BaseDTO):
    preset_id: int
    guild_id: DiscordId
    name: str
    points: int
    timer: int
    team_size: int
    point_scale: int

    model_config = {"from_attributes": True}


class PresetDetailDTO(PresetDTO):
    preset_members: list[PresetMemberDetailDTO]


class CreatePresetDTO(BaseDTO):
    name: NameStr
    points: int = Field(ge=0, le=1000)
    timer: int = Field(ge=1, le=60)
    team_size: int = Field(ge=1, le=10)
    point_scale: int = Field(ge=1, le=10)


class UpdatePresetDTO(BaseDTO):
    name: NameStr | None = None
    points: int | None = Field(default=None, ge=0, le=1000)
    timer: int | None = Field(default=None, ge=1, le=60)
    team_size: int | None = Field(default=None, ge=1, le=10)
    point_scale: int | None = Field(default=None, ge=1, le=10)
