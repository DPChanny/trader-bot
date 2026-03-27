from . import BaseDTO
from .manager_dto import ManagerDetailDTO


class GuildDTO(BaseDTO):
    guild_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}


class GuildDetailDTO(GuildDTO):
    managers: list[ManagerDetailDTO] = []


class UpdateGuildDTO(BaseDTO):
    name: str | None = None


class InviteUrlDTO(BaseDTO):
    url: str
