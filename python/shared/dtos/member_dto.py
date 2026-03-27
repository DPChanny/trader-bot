from pydantic import computed_field

from . import BaseDTO, NullableStr


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: int
    alias: str | None
    riot_id: str | None
    discord_id: str | None

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def profile_url(self) -> str | None:
        from ..utils.env import get_profile_url

        if not self.discord_id:
            return None
        return get_profile_url(self.member_id)


class AddMemberDTO(BaseDTO):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None


class UpdateMemberDTO(BaseDTO):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None
