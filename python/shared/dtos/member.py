from enum import IntEnum

from pydantic import computed_field

from . import BaseDTO, BaseEntityDTO, BigInt, NullableNameStr, NullableUrlStr
from .user import UserDetailDTO


class Role(IntEnum):
    VIEWER = 0
    EDITOR = 1
    ADMIN = 2
    OWNER = 3


class MemberDTO(BaseEntityDTO):
    member_id: int
    guild_id: BigInt
    user_id: BigInt
    role: Role
    name: str | None
    alias: str | None
    avatar_hash: str | None


class MemberDetailDTO(MemberDTO):
    user: UserDetailDTO
    info_url: str | None

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
