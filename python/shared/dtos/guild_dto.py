from . import BaseDto
from .manager_dto import ManagerDetailDTO


class GuildDTO(BaseDto):
    guild_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}


class GuildDetailDTO(GuildDTO):
    managers: list[ManagerDetailDTO] = []


class UpdateGuildDTO(BaseDto):
    name: str | None = None


class InviteUrlDTO(BaseDto):
    url: str
