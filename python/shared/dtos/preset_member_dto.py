from . import BaseDTO
from .member_dto import MemberDTO
from .preset_member_position_dto import PresetMemberPositionDTO


class PresetMemberDTO(BaseDTO):
    preset_member_id: int
    preset_id: int
    member_id: int
    tier_id: int | None = None
    is_leader: bool = False

    model_config = {"from_attributes": True}


class PresetMemberDetailDTO(PresetMemberDTO):
    member: MemberDTO | None = None
    preset_member_positions: list[PresetMemberPositionDTO] = []


class AddPresetMemberDTO(BaseDTO):
    member_id: int
    tier_id: int | None = None
    is_leader: bool = False


class UpdatePresetMemberDTO(BaseDTO):
    tier_id: int | None = None
    is_leader: bool | None = None
