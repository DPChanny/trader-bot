"""
41xx 401 Auth
42xx 422 Validation
43xx 403 Forbidden
44xx 404 Not found
50xx 500 Unexpected
"""

from enum import IntEnum


class AuthErrorCode(IntEnum):
    Unauthorized = 4101
    IncorrectJWTToken = 4102
    ExpiredJWTToken = 4103
    ExchangeFailed = 4104


class ValidationErrorCode(IntEnum):
    Invalid = 4201


class AuctionErrorCode(IntEnum):
    InsufficientLeaders = 4202
    ForbiddenAccess = 4301
    NotFound = 4401


class BidErrorCode(IntEnum):
    TeamFull = 4203
    TooHigh = 4204
    TooLow = 4205
    NotLeader = 4302


class GuildErrorCode(IntEnum):
    NotFound = 4402


class MemberErrorCode(IntEnum):
    InsufficientRole = 4303
    ForbiddenRole = 4304
    NotMember = 4305
    NotFound = 4403


class PositionErrorCode(IntEnum):
    NotFound = 4404


class PresetErrorCode(IntEnum):
    NotFound = 4405


class PresetMemberErrorCode(IntEnum):
    NotFound = 4406


class PresetMemberPositionErrorCode(IntEnum):
    Duplicated = 4206
    NotFound = 4407


class TierErrorCode(IntEnum):
    NotFound = 4408


class UserErrorCode(IntEnum):
    NotFound = 4409


class UnexpectedErrorCode(IntEnum):
    Internal = 5001
    External = 5002


class TokenError(Exception):
    def __init__(self, code: AuthErrorCode | ValidationErrorCode) -> None:
        self.code = code


class HTTPError(Exception):
    def __init__(self, code: IntEnum) -> None:
        self.code: int = code.value
        self.status_code: int = {
            41: 401,
            42: 422,
            43: 403,
            44: 404,
            50: 500,
        }[code.value // 100]
        self.function: str | None = None
        super().__init__(str(code.value))


class WSError(Exception):
    def __init__(self, code: IntEnum) -> None:
        self.code: int = code.value
        self.function: str | None = None
        super().__init__(str(code.value))
