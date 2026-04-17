import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError


SENSITIVE_KEYS = {
    "token",
    "access_token",
    "refresh_token",
    "exchange_token",
    "code",
}

EXCLUDED_REQUEST_ARG_NAMES = {"session", "ws", "websocket", "bot"}


def _is_dto_argument(name: str) -> bool:
    return name == "dto"


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


def _extract_request_dto(
    sig: inspect.Signature, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> dict[str, Any]:
    bound = sig.bind_partial(*args, **kwargs)
    dto_entries: list[tuple[str, BaseModel]] = []

    for name, value in bound.arguments.items():
        if name in EXCLUDED_REQUEST_ARG_NAMES:
            continue

        if _is_dto_argument(name) and not isinstance(value, BaseModel):
            raise TypeError(f"'{name}' must be a pydantic BaseModel")

        if _is_dto_argument(name):
            dto_entries.append((name, value))

    if len(dto_entries) == 1:
        return dto_entries[0][1].model_dump(exclude_unset=True)

    if len(dto_entries) > 1:
        return {name: dto.model_dump(exclude_unset=True) for name, dto in dto_entries}

    return {}


def _extract_result_dto(result: Any) -> dict[str, Any]:
    if isinstance(result, BaseModel):
        return result.model_dump(exclude_unset=True)

    if isinstance(result, dict):
        return result

    if isinstance(result, list):
        if all(isinstance(item, BaseModel) for item in result):
            return {
                "items": [item.model_dump(exclude_unset=True) for item in result],
            }
        if all(isinstance(item, dict) for item in result):
            return {"items": result}

    return {}


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        request_dto = _extract_request_dto(sig, args, kwargs)

        try:
            result = await func(*args, **kwargs)
            logger.bind(
                event={
                    "name": func.__name__,
                    "request_dto": _sanitize_payload(request_dto),
                    "result_dto": _sanitize_payload(_extract_result_dto(result)),
                    "summary": {},
                }
            ).info("")
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
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
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
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
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
