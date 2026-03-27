from enum import StrEnum

from . import BaseDTO


class AuctionStatus(StrEnum):
    WAITING = "waiting"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class MessageType(StrEnum):
    TIMER = "timer"
    PLACE_BID = "place_bid"
    BID_PLACED = "bid_placed"
    MEMBER_SOLD = "member_sold"
    MEMBER_UNSOLD = "member_unsold"
    NEXT_MEMBER = "next_member"
    QUEUE_UPDATE = "queue_update"
    INIT = "init"
    STATUS = "status"
    ERROR = "error"
    USER_CONNECTED = "user_connected"
    USER_DISCONNECTED = "user_disconnected"


class Team(BaseDTO):
    team_id: int
    leader_id: int
    member_id_list: list[int] = []
    points: int


class AuctionStateDTO(BaseDTO):
    auction_id: str
    preset_id: int
    status: AuctionStatus
    current_member_id: int | None = None
    current_bid: int | None = None
    current_bidder: int | None = None
    timer: int
    teams: list[Team]
    auction_queue: list[int]
    unsold_queue: list[int]
    connected_users: list[int]


class AuctionDTO(BaseDTO):
    auction_id: str
    preset_id: int


class TimerMessageData(BaseDTO):
    timer: int


class StatusMessageData(BaseDTO):
    status: str


class NextMemberMessageData(BaseDTO):
    member_id: int


class QueueUpdateMessageData(BaseDTO):
    auction_queue: list[int]
    unsold_queue: list[int]


class MemberSoldMessageData(BaseDTO):
    teams: list[Team]


class BidPlacedMessageData(BaseDTO):
    team_id: int
    leader_id: int
    amount: int


class WebSocketMessage(BaseDTO):
    type: str
    data: dict
