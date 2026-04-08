from . import BaseDTO


class GuildDTO(BaseDTO):
    guild_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}


class GuildDetailDTO(GuildDTO):
    pass


class UpdateGuildDTO(BaseDTO):
    name: str | None = None
