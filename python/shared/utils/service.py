import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError
from .logging import Event, LogValue


def _extract_request(
    sig: inspect.Signature, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> dict[str, LogValue] | None:
    bound = sig.bind_partial(*args, **kwargs)

    dto = bound.arguments.get("dto")
    if isinstance(dto, BaseModel):
        return {"dto": dto}

    return None


def _inject_event(
    sig: inspect.Signature, args, kwargs: dict[str, Any], function: str
) -> tuple[dict[str, Any], Event]:
    event = Event(function=function)
    if "event" in sig.parameters:
        kwargs["event"] = event
    event.request = _extract_request(sig, args, kwargs)
    return kwargs, event


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        kwargs, event = _inject_event(sig, args, kwargs, func.__name__)

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
        kwargs, event = _inject_event(sig, args, kwargs, func.__name__)

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
        kwargs, event = _inject_event(sig, args, kwargs, func.__name__)

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
