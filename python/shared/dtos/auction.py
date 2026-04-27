from enum import IntEnum
from typing import Any

from pydantic import Field

from . import BaseDTO, BigInt
from .preset import PresetDetailDTO


AUCTION_LIFETIME = 3600


class Status(IntEnum):
    WAITING = 0
    PENDING = 1
    RUNNING = 2
    COMPLETED = 3


class AuctionEventType(IntEnum):
    AUTH = 0
    INIT = 1
    ERROR = 2
    TICK = 3
    STATUS = 4
    PLACE_BID = 5
    BID_PLACED = 6
    MEMBER_SOLD = 7
    MEMBER_UNSOLD = 8
    LEADER_CONNECTED = 9
    LEADER_DISCONNECTED = 10
    NEXT_PLAYER = 11
    EXPIRED = 12


class AuctionRequestType(IntEnum):
    CREATE = 0
    PLACE_BID = 1
    LEADER_CONNECTED = 2
    LEADER_DISCONNECTED = 3


class AuctionResponseType(IntEnum):
    BID_ERROR = 0


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
    status: Status
    connected_leader_count: int


class AuctionDetailDTO(AuctionDTO):
    player_id: int | None
    bid: BidDTO | None
    teams: list[TeamDTO]
    auction_queue: list[int]
    unsold_queue: list[int]
    preset_snapshot: PresetDetailDTO | None


class InitPayloadDTO(BaseDTO):
    auction: AuctionDetailDTO
    member_id: int | None


class CreateAuctionDTO(BaseDTO):
    send_invite: bool


class PlaceBidPayloadDTO(BaseDTO):
    amount: int = Field(ge=1, le=10000)


class AuthPayloadDTO(BaseDTO):
    access_token: str | None


class ErrorPayloadDTO(BaseDTO):
    code: int


class TickPayloadDTO(BaseDTO):
    timer: int


class StatusPayloadDTO(BaseDTO):
    status: Status


class BidPlacedPayloadDTO(BaseDTO):
    player_id: int
    leader_id: int
    amount: int


class MemberSoldPayloadDTO(BaseDTO):
    player_id: int
    leader_id: int
    amount: int


class MemberUnsoldPayloadDTO(BaseDTO):
    player_id: int


class NextPlayerPayloadDTO(BaseDTO):
    player_id: int
    teams: list[TeamDTO]
    auction_queue: list[int]
    unsold_queue: list[int]


class AuctionEventEnvelopeDTO(BaseDTO):
    type: AuctionEventType
    payload: Any | None


class CreateRequestPayloadDTO(BaseDTO):
    auction_id: BigInt
    preset_snapshot: PresetDetailDTO


class BidErrorResponsePayloadDTO(BaseDTO):
    leader_id: int
    code: int


class AuctionRequestEnvelopeDTO(BaseDTO):
    type: AuctionRequestType
    payload: Any | None


class AuctionResponseEnvelopeDTO(BaseDTO):
    type: AuctionResponseType
    payload: Any | None
