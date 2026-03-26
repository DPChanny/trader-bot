from enum import StrEnum

from ..utils.dto import BaseDto


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


class Team(BaseDto):
    team_id: int
    leader_id: int
    member_id_list: list[int] = []
    points: int


class AuctionStateDTO(BaseDto):
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


class AuctionDTO(BaseDto):
    auction_id: str
    preset_id: int


class TimerMessageData(BaseDto):
    timer: int


class StatusMessageData(BaseDto):
    status: str


class NextUserMessageData(BaseDto):
    user_id: int


class QueueUpdateMessageData(BaseDto):
    auction_queue: list[int]
    unsold_queue: list[int]


class UserSoldMessageData(BaseDto):
    teams: list[Team]


class BidPlacedMessageData(BaseDto):
    team_id: int
    leader_id: int
    amount: int


class ErrorMessageData(BaseDto):
    error: str


class WebSocketMessage(BaseDto):
    type: str
    data: dict
