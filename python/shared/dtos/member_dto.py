from pydantic import computed_field

from ..entities.member import Role
from . import BaseDTO, DiscordId, NullableStr
from .discord_user_dto import DiscordUserDetailDTO
from .guild_dto import GuildDTO


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: DiscordId
    discord_user_id: DiscordId
    role: Role
    name: str | None
    alias: str | None
    avatar_hash: str | None
    info_url: str | None

    model_config = {"from_attributes": True}


class MemberDetailDTO(MemberDTO):
    discord_user: DiscordUserDetailDTO
    guild: GuildDTO

    @computed_field
    @property
    def avatar_url(self) -> str | None:
        if not self.avatar_hash:
            return None
        ext = "gif" if self.avatar_hash.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/guilds/{self.guild.discord_id}/users/{self.discord_user_id}/avatars/{self.avatar_hash}.{ext}?size=256"


class UpdateMemberDTO(BaseDTO):
    alias: NullableStr = None
    info_url: NullableStr = None
    role: Role | None = None
