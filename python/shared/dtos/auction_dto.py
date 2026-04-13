from enum import StrEnum

from shared.dtos.preset_dto import PresetDetailDTO

from . import BaseDTO, BigInt


class MessageType(StrEnum):
    AUTH = "auth"
    TIMER = "timer"
    PLACE_BID = "place_bid"
    BID_PLACED = "bid_placed"
    MEMBER_SOLD = "member_sold"
    NEXT_MEMBER = "next_member"
    QUEUE_UPDATE = "queue_update"
    INIT = "init"
    STATUS = "status"
    ERROR = "error"
    USER_CONNECTED = "user_connected"
    USER_DISCONNECTED = "user_disconnected"


class TeamDTO(BaseDTO):
    team_id: int
    leader_id: int
    member_ids: list[int]
    points: int


class BidDTO(BaseDTO):
    amount: int
    leader_id: int


class AuctionDTO(BaseDTO):
    auction_id: BigInt
    guild_id: int
    preset_id: int
    status: int
    current_member_id: int | None
    current_bid: BidDTO | None
    timer: int


class AuctionDetailDTO(AuctionDTO):
    teams: list[TeamDTO]
    auction_queue: list[int]
    unsold_queue: list[int]
    connected_member_ids: list[int]
    preset_snapshot: PresetDetailDTO | None


class CreateAuctionDTO(BaseDTO):
    is_public: bool
    send_invite: bool


class TimerMessageData(BaseDTO):
    timer: int


class StatusMessageData(BaseDTO):
    status: int


class NextMemberMessageData(BaseDTO):
    member_id: int


class QueueUpdateMessageData(BaseDTO):
    auction_queue: list[int]
    unsold_queue: list[int]


class MemberSoldMessageData(BaseDTO):
    teams: list[TeamDTO]


class BidPlacedMessageData(BaseDTO):
    team_id: int
    leader_id: int
    amount: int


class WebSocketMessage(BaseDTO):
    type: str
    data: dict
