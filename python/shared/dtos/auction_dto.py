from enum import IntEnum
from typing import Any

from shared.dtos.preset_dto import PresetDetailDTO

from . import BaseDTO, BigInt


class MessageType(IntEnum):
    AUTH = 0
    INIT = 1
    ERROR = 2
    TIMER = 3
    STATUS = 4
    PLACE_BID = 5
    BID_PLACED = 6
    MEMBER_SOLD = 7
    MEMBER_UNSOLD = 8
    MEMBER_CONNECTED = 9
    MEMBER_DISCONNECTED = 10
    NEXT_MEMBER = 11


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


class InitDTO(AuctionDetailDTO):
    team_id: int | None
    member_id: int | None


class CreateAuctionDTO(BaseDTO):
    is_public: bool
    send_invite: bool


class TimerDTO(BaseDTO):
    timer: int


class StatusDTO(BaseDTO):
    status: int


class NextMemberDTO(BaseDTO):
    member_id: int
    auction_queue: list[int]
    unsold_queue: list[int]


class MemberSoldDTO(BaseDTO):
    teams: list[TeamDTO]
    auction_queue: list[int]
    unsold_queue: list[int]


class MemberUnsoldDTO(BaseDTO):
    member_id: int


class PlaceBidDTO(BaseDTO):
    amount: int


class BidPlacedDTO(BaseDTO):
    leader_id: int
    amount: int


class MemberConnectedDTO(BaseDTO):
    member_id: int


class MemberDisconnectedDTO(BaseDTO):
    member_id: int


class ErrorDTO(BaseDTO):
    code: int


class AuctionMessageDTO(BaseDTO):
    type: MessageType
    dto: dict[str, Any] | None = None
