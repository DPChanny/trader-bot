from . import BaseDTO, DiscordId
from .discord_dto import DiscordUserDetailDTO


class UserDTO(BaseDTO):
    discord_id: DiscordId

    model_config = {"from_attributes": True}


class UserDetailDTO(UserDTO):
    discord_user: DiscordUserDetailDTO
