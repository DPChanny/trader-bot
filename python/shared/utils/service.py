import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError, get_error_level
from .logging import Event, logging_context


def _inject_event(
    sig: inspect.Signature, args, kwargs: dict[str, Any], event: Event
) -> None:
    bound = sig.bind_partial(*args, **kwargs)
    for name, param in sig.parameters.items():
        if param.annotation is Event:
            kwargs[name] = event
        elif isinstance(param.annotation, type) and issubclass(
            param.annotation, BaseModel
        ):
            value = bound.arguments.get(name)
            if isinstance(value, BaseModel):
                event.input = {name: value}


def _log_event(event: Event, level: str) -> None:
    logger.bind(event=event).log(level, "")


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event = Event(Event.Type.HTTP_SERVICE, detail={"function": func.__name__})
        _inject_event(sig, args, kwargs, event)

        try:
            result = await func(*args, **kwargs)
            if event.result is None:
                event.result = result
            _log_event(event, "DEBUG")
            return result
        except HTTPError as error:
            _log_event(event, get_error_level(error))
            raise
        except Exception as error:
            http_error = HTTPError(UnexpectedErrorCode.Internal)
            _log_event(event, get_error_level(http_error))
            raise http_error from error

    return wrapper


def bot_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event = Event(Event.Type.BOT_SERVICE, detail={"function": func.__name__})
        _inject_event(sig, args, kwargs, event)

        async with logging_context({"function": func.__name__}):
            try:
                result = await func(*args, **kwargs)
                if event.result is None:
                    event.result = result
                _log_event(event, "INFO")
                return result
            except AppError as error:
                _log_event(event, get_error_level(error))
                raise
            except Exception as error:
                app_error = AppError(UnexpectedErrorCode.Internal)
                _log_event(event, get_error_level(app_error))
                raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event = Event(Event.Type.WS_SERVICE, detail={"function": func.__name__})
        _inject_event(sig, args, kwargs, event)

        try:
            result = await func(*args, **kwargs)
            if event.result is None:
                event.result = result
            _log_event(event, "DEBUG")
            return result
        except WSError as error:
            _log_event(event, get_error_level(error))
            raise
        except ValidationError, JSONDecodeError:
            _log_event(event, "WARNING")
            raise
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            _log_event(event, get_error_level(ws_error))
            raise ws_error from error

    return wrapper
