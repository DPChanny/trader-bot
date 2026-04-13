from . import BaseDTO
from .member_dto import MemberDetailDTO
from .preset_member_position_dto import PresetMemberPositionDetailDTO
from .tier_dto import TierDTO


class PresetMemberDTO(BaseDTO):
    preset_member_id: int
    preset_id: int
    member_id: int
    tier_id: int | None
    is_leader: bool


class PresetMemberDetailDTO(PresetMemberDTO):
    member: MemberDetailDTO
    tier: TierDTO | None
    preset_member_positions: list[PresetMemberPositionDetailDTO]


class AddPresetMemberDTO(BaseDTO):
    member_id: int
    tier_id: int | None
    is_leader: bool


class UpdatePresetMemberDTO(BaseDTO):
    tier_id: int | None = None
    is_leader: bool | None = None
