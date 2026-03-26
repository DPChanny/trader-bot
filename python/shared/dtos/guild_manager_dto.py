from shared.entities.guild_manager import GuildRole

from . import BaseDto


class ManagerDTO(BaseDto):
    manager_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}


class GuildManagerDTO(BaseDto):
    guild_manager_id: int
    guild_id: int
    manager_id: int
    role: GuildRole

    model_config = {"from_attributes": True}


class GuildManagerDetailDTO(GuildManagerDTO):
    manager: ManagerDTO

    @classmethod
    def model_validate(cls, obj, **kwargs):  # type: ignore[override]
        data = {
            "guild_manager_id": obj.guild_manager_id,
            "guild_id": obj.guild_id,
            "manager_id": obj.manager_id,
            "role": obj.role,
            "manager": ManagerDTO.model_validate(obj.manager),
        }
        return cls(**data)


class AddGuildManagerDTO(BaseDto):
    manager_id: int
    role: GuildRole


class UpdateGuildManagerDTO(BaseDto):
    role: GuildRole | None = None
