from pydantic import computed_field

from . import BaseDto, NullableStr


class MemberDTO(BaseDto):
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


class AddMemberDTO(BaseDto):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None


class UpdateMemberDTO(BaseDto):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None
