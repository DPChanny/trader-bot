from . import BaseDto


class UserDTO(BaseDto):
    user_id: int
    discord_id: str
    name: str

    model_config = {"from_attributes": True}
