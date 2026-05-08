from . import BaseDTO, BaseEntityDTO, NullableUrlStr
from .member import MemberDetailDTO
from .preset_member_position import PresetMemberPositionDetailDTO
from .tier import TierDTO


class PresetMemberDTO(BaseEntityDTO):
    preset_member_id: int
    preset_id: int
    member_id: int
    tier_id: int | None
    is_leader: bool


class PresetMemberDetailDTO(PresetMemberDTO):
    member: MemberDetailDTO
    tier: TierDTO | None
    preset_member_positions: list[PresetMemberPositionDetailDTO]
    info_url: str | None


class AddPresetMemberDTO(BaseDTO):
    member_id: int
    tier_id: int | None
    is_leader: bool
    info_url: NullableUrlStr


class UpdatePresetMemberDTO(BaseDTO):
    tier_id: int | None = None
    is_leader: bool | None = None
    info_url: NullableUrlStr = None
