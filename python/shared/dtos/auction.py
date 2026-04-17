from enum import IntEnum
from typing import Any

from pydantic import Field

from shared.dtos.preset import PresetDetailDTO

from . import BaseDTO, BigInt


class Status(IntEnum):
    WAITING = 0
    RUNNING = 1
    COMPLETED = 2


class AuctionMessageType(IntEnum):
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
    status: Status
    current_member_id: int | None
    current_bid: BidDTO | None
    timer: int


class AuctionDetailDTO(AuctionDTO):
    teams: list[TeamDTO]
    auction_queue: list[int]
    unsold_queue: list[int]
    connected_member_ids: list[int]
    preset_snapshot: PresetDetailDTO | None


class InitPayloadDTO(BaseDTO):
    auction: AuctionDetailDTO
    team_id: int | None
    member_id: int | None


class CreateAuctionDTO(BaseDTO):
    is_public: bool
    send_invite: bool


class TimerPayloadDTO(BaseDTO):
    timer: int


class StatusPayloadDTO(BaseDTO):
    status: Status


class NextMemberPayloadDTO(BaseDTO):
    member_id: int
    auction_queue: list[int]
    unsold_queue: list[int]


class MemberSoldPayloadDTO(BaseDTO):
    teams: list[TeamDTO]
    auction_queue: list[int]
    unsold_queue: list[int]


class MemberUnsoldPayloadDTO(BaseDTO):
    member_id: int


class PlaceBidPayloadDTO(BaseDTO):
    amount: int = Field(ge=1, le=10000)


class AuthPayloadDTO(BaseDTO):
    token: str | None


class BidPlacedPayloadDTO(BaseDTO):
    leader_id: int
    amount: int


class MemberConnectedPayloadDTO(BaseDTO):
    member_id: int


class MemberDisconnectedPayloadDTO(BaseDTO):
    member_id: int


class ErrorPayloadDTO(BaseDTO):
    code: int


class AuctionMessageEnvelopeDTO(BaseDTO):
    type: AuctionMessageType
    payload: BaseDTO | dict[str, Any] | None
