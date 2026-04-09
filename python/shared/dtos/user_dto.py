from . import BaseDTO
from .discord_dto import DiscordDetailDTO


class UserDTO(BaseDTO):
    user_id: int
    discord_id: str

    model_config = {"from_attributes": True}


class UserDetailDTO(UserDTO):
    discord: DiscordDetailDTO
