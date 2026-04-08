from . import BaseDTO, NullableStr
from .discord_dto import DiscordDTO


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: int
    riot_id: str | None
    discord_id: str | None

    model_config = {"from_attributes": True}


class MemberDetailDTO(MemberDTO):
    discord: DiscordDTO | None = None


class AddMemberDTO(BaseDTO):
    riot_id: NullableStr = None
    discord_id: NullableStr = None


class UpdateMemberDTO(BaseDTO):
    riot_id: NullableStr = None
    discord_id: NullableStr = None
