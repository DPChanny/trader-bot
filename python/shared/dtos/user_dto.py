from pydantic import computed_field

from ..utils.dto import BaseDto, NullableStr


class UserDTO(BaseDto):
    user_id: int
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
        return get_profile_url(self.user_id)


class AddUserDTO(BaseDto):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None


class UpdateUserDTO(BaseDto):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None
