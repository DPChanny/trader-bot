"""
41xx 401 Auth
42xx 422 Validation
43xx 403 Forbidden
44xx 404 Not found
50xx 500 Unexpected
"""

import traceback
from enum import IntEnum

from fastapi.responses import JSONResponse
from loguru import logger

from .logging import Event


class AuthErrorCode(IntEnum):
    Unauthorized = 4101


class TokenErrorCode(IntEnum):
    IncorrectJWTToken = 4102
    ExpiredJWTToken = 4103
    ExchangeFailed = 4104


class ValidationErrorCode(IntEnum):
    Invalid = 4201


class AuctionErrorCode(IntEnum):
    InsufficientLeaders = 4202
    BidTeamFull = 4203
    BidTooHigh = 4204
    BidTooLow = 4205
    ForbiddenAccess = 4301
    BidNotLeader = 4302
    NotFound = 4401


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


type AppErrorCode = (
    AuthErrorCode
    | TokenErrorCode
    | ValidationErrorCode
    | AuctionErrorCode
    | GuildErrorCode
    | MemberErrorCode
    | PositionErrorCode
    | PresetErrorCode
    | PresetMemberErrorCode
    | PresetMemberPositionErrorCode
    | TierErrorCode
    | UserErrorCode
    | UnexpectedErrorCode
)


class TokenError(Exception):
    def __init__(self, code: TokenErrorCode) -> None:
        self.code = code


class AppError(Exception):
    def __init__(self, code: AppErrorCode) -> None:
        self.code: int = code.value
        self.event: Event | None = None
        super().__init__(str(code.value))


class HTTPError(AppError):
    def __init__(self, code: AppErrorCode) -> None:
        super().__init__(code)
        self.status_code: int = {41: 401, 42: 422, 43: 403, 44: 404, 50: 500}[
            self.code // 100
        ]


class WSError(AppError):
    def __init__(self, code: AppErrorCode) -> None:
        super().__init__(code)


def _build_event(error: AppError) -> Event:
    event = error.event or Event()

    exception = "".join(
        traceback.format_exception(type(error), error, error.__traceback__)
    )

    event.error = {"code": error.code, "exception": exception}
    return event


def handle_app_error(error: AppError) -> None:
    event = _build_event(error)
    if error.code < 5000:
        logger.bind(event=event).warning("")
    else:
        logger.bind(event=event).error("")


def handle_http_error(error: HTTPError) -> JSONResponse:
    event = _build_event(error)
    if error.status_code < 500:
        logger.bind(event=event).warning("")
    else:
        logger.bind(event=event).error("")

    return JSONResponse(status_code=error.status_code, content={"code": error.code})


def handle_ws_error(error: WSError) -> None:
    event = _build_event(error)
    if error.code < 5000:
        logger.bind(event=event).warning("")
    else:
        logger.bind(event=event).error("")
