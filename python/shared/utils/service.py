import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError


EXCLUDED_REQUEST_ARG_NAMES = {"session", "ws", "websocket", "bot"}


def _redact(value: Any) -> Any:
    if isinstance(value, BaseModel):
        return _redact(value.model_dump(exclude_unset=True))

    if isinstance(value, dict):
        sanitized: dict[str, Any] = {}
        for key, item in value.items():
            if isinstance(key, str) and key.lower() in {
                "access_token",
                "refresh_token",
                "exchange_token",
            }:
                sanitized[key] = "[REDACTED]"
            else:
                sanitized[key] = _redact(item)
        return sanitized

    if isinstance(value, list):
        return [_redact(item) for item in value]

    return value


def _extract_request_dto(
    sig: inspect.Signature, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> dict[str, Any]:
    bound = sig.bind_partial(*args, **kwargs)
    dto_entries: list[tuple[str, BaseModel]] = []

    for name, value in bound.arguments.items():
        if name in EXCLUDED_REQUEST_ARG_NAMES:
            continue

        if name == "dto" and not isinstance(value, BaseModel):
            raise TypeError(f"'{name}' must be a pydantic BaseModel")

        if name == "dto":
            dto_entries.append((name, value))

    if len(dto_entries) == 1:
        return dto_entries[0][1].model_dump(exclude_unset=True)

    if len(dto_entries) > 1:
        return {name: dto.model_dump(exclude_unset=True) for name, dto in dto_entries}

    return {}


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        request_dto = _redact(_extract_request_dto(sig, args, kwargs))

        try:
            result = await func(*args, **kwargs)
            sanitized_result = _redact(result)
            result_dto = (
                sanitized_result if isinstance(sanitized_result, (dict, list)) else {}
            )

            logger.bind(
                event={
                    "function": func.__name__,
                    "request_dto": request_dto,
                    "result_dto": result_dto,
                    "summary": {},
                }
            ).info("succeeded")
            return result
        except HTTPError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request_dto is None:
                error.request_dto = request_dto
            raise
        except Exception as error:
            http_error = HTTPError(UnexpectedErrorCode.Internal)
            http_error.function = func.__name__
            http_error.request_dto = request_dto
            raise http_error from error

    return wrapper


def bot_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        request_dto = _redact(_extract_request_dto(sig, args, kwargs))

        try:
            return await func(*args, **kwargs)
        except AppError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request_dto is None:
                error.request_dto = request_dto
            raise
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            app_error.request_dto = request_dto
            raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        request_dto = _redact(_extract_request_dto(sig, args, kwargs))

        try:
            return await func(*args, **kwargs)
        except WSError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request_dto is None:
                error.request_dto = request_dto
            raise
        except (ValidationError, JSONDecodeError):
            raise
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            ws_error.function = func.__name__
            ws_error.request_dto = request_dto
            raise ws_error from error

    return wrapper
