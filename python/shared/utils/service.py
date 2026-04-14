import functools
import inspect
from json import JSONDecodeError

from loguru import logger
from pydantic import ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError


def http_service(func):
    sig = inspect.signature(func)
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: dict | None = None
        if has_event:
            if "event" not in kwargs or kwargs["event"] is None:
                kwargs["event"] = {}
            event = kwargs["event"]

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(function=func.__name__, event=event).info("")
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
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: dict | None = None
        if has_event:
            if "event" not in kwargs or kwargs["event"] is None:
                kwargs["event"] = {}
            event = kwargs["event"]

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(function=func.__name__, event=event).info("")
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
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: dict | None = None
        if has_event:
            if "event" not in kwargs or kwargs["event"] is None:
                kwargs["event"] = {}
            event = kwargs["event"]

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(function=func.__name__, event=event).info("")
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
