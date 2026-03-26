from . import BaseDto
from .guild_manager_dto import GuildManagerDetailDTO


class GuildDTO(BaseDto):
    guild_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}


class GuildDetailDTO(GuildDTO):
    guild_managers: list[GuildManagerDetailDTO] = []


class AddGuildDTO(BaseDto):
    discord_id: str
    name: str


class UpdateGuildDTO(BaseDto):
    name: str | None = None
