from pydantic import computed_field

from . import BaseDTO, BigInt


class UserDTO(BaseDTO):
    discord_id: BigInt
    name: str
    avatar_hash: str | None


class UserDetailDTO(UserDTO):
    @computed_field
    @property
    def avatar_url(self) -> str | None:
        if not self.avatar_hash:
            return None
        ext = "gif" if self.avatar_hash.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/avatars/{self.discord_id}/{self.avatar_hash}.{ext}?size=256"
