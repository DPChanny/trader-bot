from shared.entities.manager import Role

from . import BaseDto
from .user_dto import UserDTO


class ManagerDTO(BaseDto):
    manager_id: int
    guild_id: int
    user_id: int
    role: Role

    model_config = {"from_attributes": True}


class ManagerDetailDTO(ManagerDTO):
    user: UserDTO

    @classmethod
    def model_validate(cls, obj, **kwargs):  # type: ignore[override]
        data = {
            "manager_id": obj.manager_id,
            "guild_id": obj.guild_id,
            "user_id": obj.user_id,
            "role": obj.role,
            "user": UserDTO.model_validate(obj.user),
        }
        return cls(**data)


class AddManagerDTO(BaseDto):
    user_id: int
    role: Role


class UpdateManagerDTO(BaseDto):
    role: Role | None = None
