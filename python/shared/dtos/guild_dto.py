from . import BaseDto
from .manager_dto import ManagerDetailDTO


class GuildDTO(BaseDto):
    guild_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}


class GuildDetailDTO(GuildDTO):
    managers: list[ManagerDetailDTO] = []


class AddGuildDTO(BaseDto):
    discord_id: str
    name: str


class UpdateGuildDTO(BaseDto):
    name: str | None = None


class BotInviteUrlDTO(BaseDto):
    url: str
