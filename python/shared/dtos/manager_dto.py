from shared.entities.manager import Role

from . import BaseDTO
from .user_dto import UserDTO


class ManagerDTO(BaseDTO):
    manager_id: int
    guild_id: int
    user_id: int
    role: Role

    model_config = {"from_attributes": True}


class ManagerDetailDTO(ManagerDTO):
    user: UserDTO


class AddManagerDTO(BaseDTO):
    user_id: int
    role: Role


class UpdateManagerDTO(BaseDTO):
    role: Role | None = None
