from enum import IntEnum

from shared.dtos.preset_dto import PresetDetailDTO

from . import BaseDTO, BigInt


class MessageType(IntEnum):
    AUTH = 0
    TIMER = 1
    PLACE_BID = 2
    BID_PLACED = 3
    MEMBER_SOLD = 4
    NEXT_MEMBER = 5
    INIT = 6
    STATUS = 7
    ERROR = 8
    MEMBER_CONNECTED = 9
    MEMBER_DISCONNECTED = 10


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


class AuctionInitDTO(AuctionDetailDTO):
    team_id: int | None
    member_id: int | None
    is_leader: bool


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


class BidPlacedDTO(BaseDTO):
    team_id: int
    leader_id: int
    amount: int


class MemberConnectionDTO(BaseDTO):
    member_id: int


class ErrorDTO(BaseDTO):
    code: int
