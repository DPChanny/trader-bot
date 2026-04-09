from shared.entities.member import Role

from . import BaseDTO, NullableStr
from .discord_dto import DiscordDTO


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: int
    riot_id: str | None
    discord_id: str
    role: Role

    model_config = {"from_attributes": True}


class MemberDetailDTO(MemberDTO):
    discord: DiscordDTO


class AddMemberDTO(BaseDTO):
    discord_id: str
    riot_id: NullableStr = None


class UpdateMemberDTO(BaseDTO):
    riot_id: NullableStr = None
    role: Role | None = None
