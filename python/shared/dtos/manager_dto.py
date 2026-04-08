from shared.entities.manager import Role

from . import BaseDTO
from .discord_dto import DiscordDTO


class ManagerDTO(BaseDTO):
    manager_id: int
    guild_id: int
    discord_id: str
    role: Role

    model_config = {"from_attributes": True}


class ManagerDetailDTO(ManagerDTO):
    discord: DiscordDTO


class AddManagerDTO(BaseDTO):
    discord_id: str
    role: Role


class UpdateManagerDTO(BaseDTO):
    role: Role | None = None
