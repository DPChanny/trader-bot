from pydantic import computed_field

from shared.entities.member import Role

from . import BaseDTO, NullableStr
from .discord_dto import DiscordDetailDTO
from .guild_dto import GuildDTO


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: int
    discord_id: str
    role: Role
    riot_id: str | None
    name: str | None
    alias: str | None
    avatar_hash: str | None

    model_config = {"from_attributes": True}


class MemberDetailDTO(MemberDTO):
    discord: DiscordDetailDTO
    guild: GuildDTO

    @computed_field
    @property
    def avatar_url(self) -> str | None:
        if not self.avatar_hash:
            return None
        ext = "gif" if self.avatar_hash.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/guilds/{self.guild.discord_id}/users/{self.discord_id}/avatars/{self.avatar_hash}.{ext}?size=256"


class UpdateMemberDTO(BaseDTO):
    riot_id: NullableStr = None
    alias: NullableStr = None
    role: Role | None = None
