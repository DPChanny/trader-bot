from . import BaseDTO
from .discord_dto import DiscordDTO


class UserDTO(BaseDTO):
    user_id: int
    discord_id: str

    model_config = {"from_attributes": True}


class UserDetailDTO(UserDTO):
    discord: DiscordDTO
