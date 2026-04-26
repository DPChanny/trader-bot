from enum import IntEnum
from typing import Any

from pydantic import Field

from . import BaseDTO, BigInt
from .preset import PresetDetailDTO


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


class AuctionEventEnvelopeDTO(BaseDTO):
    type: AuctionEventType
    payload: Any | None
