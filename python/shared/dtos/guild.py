from pydantic import computed_field

from . import BaseDTO, BaseEntityDTO, BigInt


class GuildDTO(BaseEntityDTO):
    discord_id: BigInt
    name: str
    icon_hash: str | None
    invite_channel_id: BigInt | None


class GuildDetailDTO(GuildDTO):
    @computed_field
    @property
    def icon_url(self) -> str | None:
        if not self.icon_hash:
            return None
        ext = "gif" if self.icon_hash.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/icons/{self.discord_id}/{self.icon_hash}.{ext}?size=256"
