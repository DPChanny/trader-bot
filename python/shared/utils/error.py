"""
40xx 400 Auction
41xx 401 Auth
42xx 422 Validation
43xx 403 Forbidden
44xx 404 Not found
45xx 401 Discord
50xx 500 Unexpected
"""

from enum import IntEnum


class AuctionErrorCode(IntEnum):
    NoMembers = 4001
    NoLeaders = 4002
    InsufficientLeaders = 4003
    BidTeamFull = 4004
    BidTooHighAmount = 4005
    BidInsufficientPoints = 4006
    BidTooLowAmount = 4007
    Forbidden = 4301
    BidNotLeader = 4302
    NotFound = 4401
    BidTeamNotFound = 4402
    BidMemberNotFound = 4403


class AuthErrorCode(IntEnum):
    Unauthorized = 4101
    InvalidJwtToken = 4102
    ExpiredJwtToken = 4103
    ExchangeFailed = 4104


class ValidationErrorCode(IntEnum):
    Invalid = 4201
    Duplicated = 4202


class DiscordErrorCode(IntEnum):
    ExchangeFailed = 4501
    FetchFailed = 4502


class UnexpectedErrorCode(IntEnum):
    Internal = 5001


class UserErrorCode(IntEnum):
    NotFound = 4404


class GuildErrorCode(IntEnum):
    NotFound = 4405


class MemberErrorCode(IntEnum):
    InsufficientRole = 4303
    ForbiddenRole = 4304
    NotFound = 4406


class PresetErrorCode(IntEnum):
    NotFound = 4407


class TierErrorCode(IntEnum):
    NotFound = 4408


class PositionErrorCode(IntEnum):
    NotFound = 4409


class PresetMemberErrorCode(IntEnum):
    NotFound = 4410


class PresetMemberPositionErrorCode(IntEnum):
    NotFound = 4411


class AppError(Exception):
    def __init__(self, code: IntEnum) -> None:
        self.code: int = code.value
        self.status_code: int = {
            40: 400,
            41: 401,
            42: 422,
            43: 403,
            44: 404,
            45: 401,
            50: 500,
        }[code.value // 100]
        self.function: str | None = None
        super().__init__(str(code.value))
