from pydantic import computed_field

from . import BaseDTO, NullableStr
from .discord_dto import DiscordDTO


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: int
    riot_id: str | None
    discord_id: str | None
    discord: DiscordDTO | None = None

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def profile_url(self) -> str | None:
        if self.discord is None:
            return None
        return self.discord.avatar_url


class AddMemberDTO(BaseDTO):
    riot_id: NullableStr = None
    discord_id: NullableStr = None


class UpdateMemberDTO(BaseDTO):
    riot_id: NullableStr = None
    discord_id: NullableStr = None
