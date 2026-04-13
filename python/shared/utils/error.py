"""
Code ranges:
    40xx  Auth          → 401
    41xx  Not found     → 404
    42xx  Role/Access   → 403
    43xx  Validation    → 422
    44xx  Auction       → 400
    45xx  Conflict      → 409
    46xx  Discord       → 401
    50xx  Server        → 500
"""

from enum import IntEnum


class _AppErrorCode(IntEnum):
    pass


class AuthErrorCode(_AppErrorCode):
    InvalidTokenType = 4001
    TokenExpired = 4002
    InvalidToken = 4003
    Failed = 4004
    InvalidExchangeToken = 4005


class UserErrorCode(_AppErrorCode):
    NotFound = 4101


class MemberErrorCode(_AppErrorCode):
    NotFound = 4102
    InsufficientRole = 4201
    InvalidRole = 4202


class PresetErrorCode(_AppErrorCode):
    NotFound = 4103


class TierErrorCode(_AppErrorCode):
    NotFound = 4104


class PositionErrorCode(_AppErrorCode):
    NotFound = 4105


class PresetMemberErrorCode(_AppErrorCode):
    NotFound = 4106


class PresetMemberPositionErrorCode(_AppErrorCode):
    NotFound = 4107
    Duplicated = 4501


class GuildErrorCode(_AppErrorCode):
    NotFound = 4108


class ValidationErrorCode(_AppErrorCode):
    Error = 4301


class AuctionErrorCode(_AppErrorCode):
    # creation
    NoMembers = 4401
    NoLeaders = 4402
    TooFewLeaders = 4403
    # session (WebSocket connect)
    NotFound = 4109
    PublicAccessDenied = 4203
    # bid
    BidNotLeader = 4204
    BidTeamNotFound = 4110
    BidNotInProgress = 4404
    BidNoCurrentMember = 4405
    BidTeamFull = 4406
    BidTooHigh = 4407
    BidInsufficientPoints = 4408
    BidTooLow = 4409


class DiscordErrorCode(_AppErrorCode):
    TokenExchangeFailed = 4601
    UserFetchFailed = 4602


class ServerErrorCode(_AppErrorCode):
    InternalError = 5001


_STATUS_MAP = {
    40: 401,
    41: 404,
    42: 403,
    43: 422,
    44: 400,
    45: 409,
    46: 401,
    50: 500,
}


class AppError(Exception):
    def __init__(self, code: _AppErrorCode) -> None:
        self.code: int = code.value
        self.status_code: int = _STATUS_MAP[code.value // 100]
        self.function: str | None = None
        super().__init__(str(code.value))
