from pydantic import BaseModel


class GetProfileDTO(BaseModel):
    discord_id: str


class SendInvitesDTO(BaseModel):
    invites: list[tuple[str, str]]


class InviteResultDTO(BaseModel):
    success_count: int
    total_count: int
