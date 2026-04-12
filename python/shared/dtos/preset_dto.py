from . import BaseDTO, DiscordId, NullableStr
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
    name: str
    points: int
    timer: int
    team_size: int
    point_scale: int


class UpdatePresetDTO(BaseDTO):
    name: NullableStr = None
    points: int | None = None
    timer: int | None = None
    team_size: int | None = None
    point_scale: int | None = None
