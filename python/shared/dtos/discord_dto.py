from pydantic import BaseModel


class GetProfileRequest(BaseModel):
    discord_id: str


class SendAuctionUrlsRequest(BaseModel):
    invites: list[tuple[str, str]]
