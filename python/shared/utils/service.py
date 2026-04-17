import functools
import inspect
from dataclasses import dataclass, field
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError


@dataclass(slots=True)
class ServiceEvent:
    name: str
    request_dto: dict[str, Any] = field(default_factory=dict)
    result_dto: dict[str, Any] = field(default_factory=dict)
    summary: dict[str, Any] = field(default_factory=dict)

    def __iter__(self):
        yield "name", self.name
        yield "request_dto", self.request_dto
        yield "result_dto", self.result_dto
        yield "summary", self.summary


SENSITIVE_KEYS = {
    "token",
    "access_token",
    "refresh_token",
    "exchange_token",
    "code",
}

EXCLUDED_REQUEST_ARG_NAMES = {"session", "ws", "websocket", "bot"}


def _sanitize_payload(value: Any) -> Any:
    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            if isinstance(key, str) and key.lower() in SENSITIVE_KEYS:
                sanitized[key] = "***"
            else:
                sanitized[key] = _sanitize_payload(item)
        return sanitized

    if isinstance(value, list):
        return [_sanitize_payload(item) for item in value]

    return value


def _to_log_dict(value: Any) -> dict[str, Any] | None:
    if isinstance(value, BaseModel):
        return _sanitize_payload(value.model_dump(exclude_unset=True))
    if isinstance(value, dict):
        return _sanitize_payload(value)
    return None


def _is_safe_scalar(value: Any) -> bool:
    return isinstance(value, (int, float, bool)) or value is None


def _set_default_request_dto(
    sig: inspect.Signature,
    args: tuple[Any, ...],
    kwargs: dict[str, Any],
    event: ServiceEvent,
) -> None:
    if event.request_dto:
        return

    bound = sig.bind_partial(*args, **kwargs)
    request: dict[str, Any] = {}
    dto_entries: list[tuple[str, dict[str, Any]]] = []

    for name, value in bound.arguments.items():
        if name in EXCLUDED_REQUEST_ARG_NAMES:
            continue

        dto_dict = _to_log_dict(value)
        if dto_dict is not None:
            dto_entries.append((name, dto_dict))
            continue

        if _is_safe_scalar(value):
            request[name] = value

    if len(dto_entries) == 1 and dto_entries[0][0] == "dto":
        request |= dto_entries[0][1]
    else:
        for name, dto_value in dto_entries:
            request[name] = dto_value

    if request:
        event.request_dto = request


def _set_default_result_dto(result: Any, event: ServiceEvent) -> None:
    if event.result_dto:
        return

    result_dto = _to_log_dict(result)
    if result_dto is not None:
        event.result_dto = result_dto


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event = ServiceEvent(name=func.__name__)
        _set_default_request_dto(sig, args, kwargs, event)

        try:
            result = await func(*args, **kwargs)
            _set_default_result_dto(result, event)
            logger.bind(event=dict(event)).info("")
            return result
        except HTTPError as error:
            if error.function is None:
                error.function = func.__name__
            raise
        except Exception as error:
            http_error = HTTPError(UnexpectedErrorCode.Internal)
            http_error.function = func.__name__
            raise http_error from error

    return wrapper


def bot_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event = ServiceEvent(name=func.__name__)
        _set_default_request_dto(sig, args, kwargs, event)

        try:
            result = await func(*args, **kwargs)
            _set_default_result_dto(result, event)
            logger.bind(event=dict(event)).info("")
            return result
        except AppError as error:
            if error.function is None:
                error.function = func.__name__
            raise
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event = ServiceEvent(name=func.__name__)
        _set_default_request_dto(sig, args, kwargs, event)

        try:
            result = await func(*args, **kwargs)
            _set_default_result_dto(result, event)
            logger.bind(event=dict(event)).info("")
            return result
        except WSError as error:
            if error.function is None:
                error.function = func.__name__
            raise
        except (ValidationError, JSONDecodeError):
            raise
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            ws_error.function = func.__name__
            raise ws_error from error

    return wrapper
