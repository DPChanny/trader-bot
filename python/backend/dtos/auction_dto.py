from enum import StrEnum

from pydantic import BaseModel

from shared.dtos.base_dto import BaseResponseDTO


class AuctionStatus(StrEnum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MessageType(StrEnum):
    TIMER = "timer"
    PLACE_BID = "place_bid"
    BID_PLACED = "bid_placed"
    USER_SOLD = "user_sold"
    USER_UNSOLD = "user_unsold"
    NEXT_USER = "next_user"
    QUEUE_UPDATE = "queue_update"
    INIT = "init"
    STATUS = "status"
    ERROR = "error"
    USER_CONNECTED = "user_connected"
    USER_DISCONNECTED = "user_disconnected"


class Team(BaseModel):
    team_id: int
    leader_id: int
    member_id_list: list[int] = []
    points: int


class AuctionStateDTO(BaseModel):
    auction_id: str
    preset_id: int
    status: AuctionStatus
    current_user_id: int | None = None
    current_bid: int | None = None
    current_bidder: int | None = None
    timer: int
    teams: list[Team]
    auction_queue: list[int]
    unsold_queue: list[int]
    connected_users: list[int]


class AuctionDTO(BaseModel):
    auction_id: str
    preset_id: int


class AddAuctionResponseDTO(BaseResponseDTO[AuctionDTO]):
    pass


class TimerMessageData(BaseModel):
    timer: int


class StatusMessageData(BaseModel):
    status: str


class NextUserMessageData(BaseModel):
    user_id: int


class QueueUpdateMessageData(BaseModel):
    auction_queue: list[int]
    unsold_queue: list[int]


class UserSoldMessageData(BaseModel):
    teams: list[Team]


class BidPlacedMessageData(BaseModel):
    team_id: int
    leader_id: int
    amount: int


class ErrorMessageData(BaseModel):
    error: str


class WebSocketMessage(BaseModel):
    type: str
    data: dict
