from pydantic import computed_field

from ..entities.member import Role
from . import BaseDTO, BigInt, NullableNameStr, NullableUrlStr
from .user import UserDetailDTO


class MemberDTO(BaseDTO):
    member_id: int
    guild_id: BigInt
    user_id: BigInt
    role: Role
    name: str | None
    alias: str | None
    avatar_hash: str | None
    info_url: str | None


class MemberDetailDTO(MemberDTO):
    user: UserDetailDTO

    @computed_field
    @property
    def avatar_url(self) -> str | None:
        if not self.avatar_hash:
            return None
        ext = "gif" if self.avatar_hash.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/guilds/{self.guild_id}/users/{self.user_id}/avatars/{self.avatar_hash}.{ext}?size=256"


class UpdateMemberDTO(BaseDTO):
    alias: NullableNameStr = None
    info_url: NullableUrlStr = None
    role: Role | None = None
