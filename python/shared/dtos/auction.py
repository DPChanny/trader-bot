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


class AuctionDetailDTO(AuctionDTO):
    status: Status
    connected_leader_count: int
    player_id: int | None
    bid: BidDTO | None
    teams: list[TeamDTO]
    auction_queue: list[int]
    unsold_queue: list[int]
    preset_snapshot: PresetDetailDTO | None
    ttl: int
    timer: int


class InitEventPayloadDTO(BaseDTO):
    auction: AuctionDetailDTO
    member_id: int | None


class PlaceBidEventPayloadDTO(BaseDTO):
    amount: int = Field(ge=1, le=10000)


class AuthEventPayloadDTO(BaseDTO):
    access_token: str | None


class ErrorEventPayloadDTO(BaseDTO):
    code: int


class TickEventPayloadDTO(BaseDTO):
    timer: int


class StatusEventPayloadDTO(BaseDTO):
    status: Status


class BidPlacedEventPayloadDTO(BaseDTO):
    leader_id: int
    amount: int


class AuctionEventEnvelopeDTO(BaseDTO):
    type: AuctionEventType
    payload: Any | None


class LeaderConnectedRequestPayloadDTO(BaseDTO):
    leader_id: int


class LeaderDisconnectedRequestPayloadDTO(BaseDTO):
    leader_id: int


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
