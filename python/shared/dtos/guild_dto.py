from pydantic import computed_field

from . import BaseDTO, DiscordId


class GuildDTO(BaseDTO):
    discord_id: DiscordId
    name: str
    icon_hash: str | None

    model_config = {"from_attributes": True}


class GuildDetailDTO(GuildDTO):
    @computed_field
    @property
    def icon_url(self) -> str | None:
        if not self.icon_hash:
            return None
        ext = "gif" if self.icon_hash.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/icons/{self.discord_id}/{self.icon_hash}.{ext}?size=256"
