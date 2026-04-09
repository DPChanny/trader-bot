from pydantic import computed_field

from . import BaseDTO


class UserDTO(BaseDTO):
    user_id: int
    discord_id: str
    name: str
    alias: str | None
    avatar_hash: str | None

    model_config = {"from_attributes": True}

    @computed_field
    @property
    def avatar_url(self) -> str | None:
        if not self.avatar_hash:
            return None
        ext = "gif" if self.avatar_hash.startswith("a_") else "png"
        return f"https://cdn.discordapp.com/avatars/{self.discord_id}/{self.avatar_hash}.{ext}?size=256"
