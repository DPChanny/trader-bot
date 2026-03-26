from ..utils.dto import BaseDto


class InviteDTO(BaseDto):
    invites: list[tuple[str, str]]
