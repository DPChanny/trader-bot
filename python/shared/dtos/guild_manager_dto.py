from shared.entities.guild_manager import GuildRole

from . import BaseDto


class UserDTO(BaseDto):
    user_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}


class GuildManagerDTO(BaseDto):
    guild_manager_id: int
    guild_id: int
    user_id: int
    role: GuildRole

    model_config = {"from_attributes": True}


class GuildManagerDetailDTO(GuildManagerDTO):
    user: UserDTO

    @classmethod
    def model_validate(cls, obj, **kwargs):  # type: ignore[override]
        data = {
            "guild_manager_id": obj.guild_manager_id,
            "guild_id": obj.guild_id,
            "user_id": obj.user_id,
            "role": obj.role,
            "user": UserDTO.model_validate(obj.user),
        }
        return cls(**data)


class AddGuildManagerDTO(BaseDto):
    user_id: int
    role: GuildRole


class UpdateGuildManagerDTO(BaseDto):
    role: GuildRole | None = None
