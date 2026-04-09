from . import BaseDTO


class GuildDTO(BaseDTO):
    guild_id: int
    discord_id: str
    name: str
    icon_url: str | None = None

    model_config = {"from_attributes": True}
