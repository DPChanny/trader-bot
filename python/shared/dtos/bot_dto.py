from pydantic import BaseModel


class InviteDTO(BaseModel):
    invites: list[tuple[str, str]]
