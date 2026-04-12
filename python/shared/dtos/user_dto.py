from . import BaseDTO, DiscordId


class UserDTO(BaseDTO):
    discord_id: DiscordId
    name: str
    avatar_hash: str | None

    model_config = {"from_attributes": True}
