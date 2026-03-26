from . import BaseDto
from .member_dto import MemberDTO
from .preset_member_position_dto import PresetMemberPositionDetailDTO
from .tier_dto import TierDTO


class PresetMemberDTO(BaseDto):
    preset_member_id: int
    preset_id: int
    member_id: int
    tier_id: int | None = None
    is_leader: bool = False

    model_config = {"from_attributes": True}


class PresetMemberDetailDTO(PresetMemberDTO):
    member: MemberDTO | None = None
    tier: TierDTO | None = None
    preset_member_positions: list[PresetMemberPositionDetailDTO] = []


class AddPresetMemberDTO(BaseDto):
    preset_id: int
    member_id: int
    tier_id: int | None = None
    is_leader: bool = False


class UpdatePresetMemberDTO(BaseDto):
    tier_id: int | None = None
    is_leader: bool | None = None
