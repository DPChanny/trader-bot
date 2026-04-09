from . import BaseDTO


class DiscordDTO(BaseDTO):
    discord_id: str
    name: str
    avatar_url: str | None

    model_config = {"from_attributes": True}
