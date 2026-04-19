import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError
from .logging import Event


def _inject_event(
    sig: inspect.Signature, args, kwargs: dict[str, Any], function: str
) -> tuple[dict[str, Any], Event]:
    event = Event(function=function)
    bound = sig.bind_partial(*args, **kwargs)
    for name, param in sig.parameters.items():
        if param.annotation is Event:
            kwargs[name] = event
        elif isinstance(param.annotation, type) and issubclass(
            param.annotation, BaseModel
        ):
            value = bound.arguments.get(name)
            if isinstance(value, BaseModel):
                event.request = {name: value}
    return kwargs, event


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        kwargs, event = _inject_event(sig, args, kwargs, func.__name__)

        try:
            result = await func(*args, **kwargs)
            if event.result is None:
                event.result = result
            logger.bind(event=event).info("")
            return result
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
            result = await func(*args, **kwargs)
            logger.bind(event=event).info("")
            return result
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
            result = await func(*args, **kwargs)
            logger.bind(event=event).info("")
            return result
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
