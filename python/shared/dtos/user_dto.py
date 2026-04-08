from . import BaseDTO


class UserDTO(BaseDTO):
    user_id: int
    discord_id: str

    model_config = {"from_attributes": True}
