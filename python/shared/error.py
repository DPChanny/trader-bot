"""
Code ranges:
  40xx  Auth
  41xx  Not found
  42xx  Role
  43xx  Validation
  44xx  Auction
  45xx  Constraint violation
  46xx  Discord
  50xx  Server
"""

import functools
from enum import Enum

from loguru import logger


class _AppErrorCode(Enum):
    def __new__(cls, code: int, http_status: int):
        obj = object.__new__(cls)
        obj._value_ = code
        obj.http_status = http_status
        return obj


class Auth(_AppErrorCode):
    InvalidTokenType = (4001, 401)
    TokenExpired = (4002, 401)
    InvalidToken = (4003, 401)
    Failed = (4004, 401)
    InvalidExchangeToken = (4005, 401)


class User(_AppErrorCode):
    NotFound = (4101, 404)


class Member(_AppErrorCode):
    NotFound = (4102, 404)
    InsufficientRole = (4201, 403)
    InvalidRole = (4202, 403)


class Preset(_AppErrorCode):
    NotFound = (4103, 404)


class Tier(_AppErrorCode):
    NotFound = (4104, 404)


class Position(_AppErrorCode):
    NotFound = (4105, 404)


class PresetMember(_AppErrorCode):
    NotFound = (4106, 404)


class PresetMemberPosition(_AppErrorCode):
    NotFound = (4107, 404)
    Duplicated = (4501, 409)


class Guild(_AppErrorCode):
    NotFound = (4108, 404)


class Validation(_AppErrorCode):
    Error = (4301, 422)


class Auction(_AppErrorCode):
    # creation
    NoMembers = (4401, 400)
    NoLeaders = (4402, 400)
    TooFewLeaders = (4403, 400)
    # session (WebSocket connect)
    NotFound = (4404, 404)
    PublicAccessDenied = (4405, 403)
    # bid
    BidNotLeader = (4406, 403)
    BidTeamNotFound = (4407, 404)
    BidNotInProgress = (4408, 400)
    BidNoCurrentMember = (4409, 400)
    BidTeamFull = (4410, 400)
    BidTooHigh = (4411, 400)
    BidInsufficientPoints = (4412, 400)
    BidTooLow = (4413, 400)


class Discord(_AppErrorCode):
    TokenExchangeFailed = (4601, 401)
    UserFetchFailed = (4602, 401)


class Server(_AppErrorCode):
    InternalError = (5001, 500)


class AppError(Exception):
    def __init__(self, code: _AppErrorCode) -> None:
        self.code: int = code.value
        self.status_code: int = code.http_status
        super().__init__(str(code.value))


def service_error_handler(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except AppError as e:
            if e.status_code < 500:
                logger.bind(
                    target_func=func.__name__,
                    error_code=e.code,
                ).warning("")
            else:
                logger.bind(
                    target_func=func.__name__,
                    error_code=e.code,
                ).error("")
            raise
        except Exception as e:
            logger.bind(
                target_func=func.__name__,
                exception_type=type(e).__name__,
            ).exception("")
            raise AppError(Server.InternalError) from None

    return wrapper
