
from pydantic import BaseModel, computed_field

from .base_dto import BaseResponseDTO


class UserDTO(BaseModel):
    user_id: int
    name: str
    riot_id: str
    discord_id: str

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def discord_profile_url(self) -> str:
        from utils.env import get_discord_profile_url

        return get_discord_profile_url(self.user_id)


class AddUserRequestDTO(BaseModel):
    name: str
    riot_id: str
    discord_id: str


class UpdateUserRequestDTO(BaseModel):
    name: str | None = None
    riot_id: str | None = None
    discord_id: str | None = None


class GetUserDetailResponseDTO(BaseResponseDTO[UserDTO]):
    pass


class GetUserListResponseDTO(BaseResponseDTO[list[UserDTO]]):
    pass
