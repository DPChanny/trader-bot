import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError
from .logging import Event


def _extract_request(
    sig: inspect.Signature, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> dict[str, Any] | None:
    bound = sig.bind_partial(*args, **kwargs)
    dtos = [
        (name, value)
        for name, value in bound.arguments.items()
        if isinstance(value, BaseModel)
    ]

    if len(dtos) == 1:
        return dtos[0][1].model_dump(exclude_unset=True)

    if len(dtos) > 1:
        return {name: dto.model_dump(exclude_unset=True) for name, dto in dtos}

    return None


def _inject_event(
    sig: inspect.Signature, kwargs: dict[str, Any], function: str
) -> tuple[dict[str, Any], Event]:
    event = Event(function=function)
    if "event" in sig.parameters:
        kwargs["event"] = event
    return kwargs, event


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        kwargs, event = _inject_event(sig, kwargs, func.__name__)
        event.request = _extract_request(sig, args, kwargs)

        try:
            response = await func(*args, **kwargs)
            if event.response is None:
                event.response = response
            logger.bind(event=event).info("succeeded")
            return response
        except HTTPError as error:
            if error.event is None:
                error.event = event
            raise
        except Exception as error:
            http_error = HTTPError(UnexpectedErrorCode.Internal)
            http_error.event = event
            raise http_error from error

    return wrapper


def bot_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        kwargs, event = _inject_event(sig, kwargs, func.__name__)
        event.request = _extract_request(sig, args, kwargs)

        try:
            response = await func(*args, **kwargs)
            if event.response is None:
                event.response = response
            logger.bind(event=event).info("succeeded")
            return response
        except AppError as error:
            if error.event is None:
                error.event = event
            raise
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.event = event
            raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        kwargs, event = _inject_event(sig, kwargs, func.__name__)
        event.request = _extract_request(sig, args, kwargs)

        try:
            return await func(*args, **kwargs)
        except WSError as error:
            if error.event is None:
                error.event = event
            raise
        except (ValidationError, JSONDecodeError):
            raise
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            ws_error.event = event
            raise ws_error from error

    return wrapper
