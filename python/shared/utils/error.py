"""
401xx 401 Unauthorized
403xx 403 Forbidden
404xx 404 Not Found
422xx 422 Invalid
500xx 500 Unexpected

xx00 = generic (no specific domain)
"""

import traceback
from enum import IntEnum

import httpx
from fastapi.responses import JSONResponse
from loguru import logger

from .logging import Event


class UnauthorizedErrorCode(IntEnum):
    Generic = 40100
    Auth = 40101
    IncorrectToken = 40102
    ExpiredToken = 40103
    ConsumedToken = 40104


class ForbiddenErrorCode(IntEnum):
    Generic = 40300
    AuctionBidNotLeader = 40301
    MemberInsufficientRole = 40302
    MemberForbiddenRole = 40303
    MemberNotMember = 40304
    SubscriptionInsufficientPlan = 40305
    SubscriptionInsufficientQuota = 40306


class NotFoundErrorCode(IntEnum):
    Generic = 40400
    Auction = 40401
    Guild = 40402
    Member = 40403
    Position = 40404
    Preset = 40405
    PresetMember = 40406
    PresetMemberPosition = 40407
    Tier = 40408
    User = 40409
    Subscription = 40410
    Billing = 40411


class InvalidErrorCode(IntEnum):
    Generic = 42200
    Request = 42201
    AuctionBidTeamFull = 42202
    AuctionBidTooLow = 42203
    AuctionBidDuplicate = 42204
    AuctionBidTooHigh = 42205
    PresetMemberPositionDuplicated = 42206


class UnexpectedErrorCode(IntEnum):
    Generic = 50000
    Internal = 50001
    External = 50002


type AppErrorCode = (
    UnauthorizedErrorCode
    | ForbiddenErrorCode
    | NotFoundErrorCode
    | InvalidErrorCode
    | UnexpectedErrorCode
)


class AppError(Exception):
    def __init__(self, code: AppErrorCode) -> None:
        self.code: int = code.value
        super().__init__(str(code.value))


class HTTPError(AppError):
    def __init__(self, code: AppErrorCode) -> None:
        super().__init__(code)
        self.status_code: int = self.code // 100


class WSError(AppError):
    def __init__(self, code: AppErrorCode) -> None:
        super().__init__(code)


def get_error_level(error: AppError) -> str:
    if isinstance(error, HTTPError):
        return "ERROR" if error.status_code >= 500 else "WARNING"
    return "ERROR" if error.code >= 50000 else "WARNING"


def _log_error(
    error: AppError, level: str, detail: dict[str, object] | None = None
) -> None:
    event = Event(Event.Type.ERROR)
    if detail is None:
        detail = {}

    detail["code"] = error.code
    if level == "ERROR":
        detail["traceback"] = "".join(
            traceback.format_exception(type(error), error, error.__traceback__)
        )
    event.detail = detail

    logger.bind(event=event).log(level, "")


def handle_app_error(error: AppError) -> None:
    _log_error(error, get_error_level(error))


def log_external_error(response: httpx.Response) -> None:
    error = AppError(UnexpectedErrorCode.External)
    _log_error(error, "WARNING", {"response": response.text})


def handle_http_error(error: HTTPError) -> JSONResponse:
    _log_error(error, get_error_level(error))
    return JSONResponse(status_code=error.status_code, content={"code": error.code})


def handle_ws_error(error: WSError) -> None:
    _log_error(error, get_error_level(error))
