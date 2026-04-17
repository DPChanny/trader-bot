import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError
from .logging import Event


EXCLUDED_REQUEST_ARG_NAMES = {"session", "ws", "websocket", "bot"}


def _extract_request(
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


def _build_event(
    sig: inspect.Signature,
    kwargs: dict[str, Any],
    request: dict[str, Any],
    function: str,
) -> tuple[dict[str, Any], Event]:
    event = Event(function=function, request=request)
    injected_kwargs = dict(kwargs)
    if "event" in sig.parameters:
        injected_kwargs["event"] = event
    return injected_kwargs, event


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        request = _extract_request(sig, args, kwargs)
        call_kwargs, event = _build_event(sig, kwargs, request, func.__name__)

        try:
            response = await func(*args, **call_kwargs)
            if event.response is None:
                event.response = response
            logger.bind(event=event).info("succeeded")
            return response
        except HTTPError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request is None:
                error.request = request
            raise
        except Exception as error:
            http_error = HTTPError(UnexpectedErrorCode.Internal)
            http_error.function = func.__name__
            http_error.request = request
            raise http_error from error

    return wrapper


def bot_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        request = _extract_request(sig, args, kwargs)
        call_kwargs, event = _build_event(sig, kwargs, request, func.__name__)

        try:
            response = await func(*args, **call_kwargs)
            if event.response is None:
                event.response = response
            logger.bind(event=event).info("succeeded")
            return response
        except AppError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request is None:
                error.request = request
            raise
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            app_error.request = request
            raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        request = _extract_request(sig, args, kwargs)
        call_kwargs, _ = _build_event(sig, kwargs, request, func.__name__)

        try:
            return await func(*args, **call_kwargs)
        except WSError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request is None:
                error.request = request
            raise
        except (ValidationError, JSONDecodeError):
            raise
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            ws_error.function = func.__name__
            ws_error.request = request
            raise ws_error from error

    return wrapper
