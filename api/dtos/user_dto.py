from typing import List, Optional

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
    name: Optional[str] = None
    riot_id: Optional[str] = None
    discord_id: Optional[str] = None


class GetUserDetailResponseDTO(BaseResponseDTO[UserDTO]):
    pass


class GetUserListResponseDTO(BaseResponseDTO[List[UserDTO]]):
    pass
