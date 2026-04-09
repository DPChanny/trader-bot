from shared.entities.member import Role

from . import BaseDTO, NullableStr
from .discord_dto import DiscordDTO


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: int
    discord_id: str
    role: Role
    riot_id: str | None
    name: str | None
    alias: str | None
    avatar_url: str | None

    model_config = {"from_attributes": True}


class MemberDetailDTO(MemberDTO):
    discord: DiscordDTO


class UpdateMemberDTO(BaseDTO):
    riot_id: NullableStr = None
    alias: NullableStr = None
    role: Role | None = None
