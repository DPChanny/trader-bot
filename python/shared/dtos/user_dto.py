from pydantic import BaseModel, computed_field

from .base_dto import BaseResponseDTO, NullableStr


class UserDTO(BaseModel):
    user_id: int
    alias: str | None
    riot_id: str | None
    discord_id: str | None

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def profile_url(self) -> str | None:
        from ..env import get_profile_url

        if not self.discord_id:
            return None
        return get_profile_url(self.user_id)


class AddUserRequestDTO(BaseModel):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None


class UpdateUserRequestDTO(BaseModel):
    alias: NullableStr = None
    riot_id: NullableStr = None
    discord_id: NullableStr = None


class GetUserDetailResponseDTO(BaseResponseDTO[UserDTO]):
    pass


class GetUserListResponseDTO(BaseResponseDTO[list[UserDTO]]):
    pass
