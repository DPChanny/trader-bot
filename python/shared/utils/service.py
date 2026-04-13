import functools
import inspect

from loguru import logger

from .error import HTTPError, UnexpectedErrorCode, WSError


def http_service(func):
    sig = inspect.signature(func)
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: dict = {}
        if has_event and "event" not in kwargs:
            kwargs["event"] = event

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(function=func.__name__, **event).info("")
            return result
        except HTTPError as error:
            error.function = func.__name__
            raise
        except Exception as error:
            app_error = HTTPError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: dict = {}
        if has_event and "event" not in kwargs:
            kwargs["event"] = event

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(function=func.__name__, **event).info("")
            return result
        except WSError as error:
            error.function = func.__name__
            logger.bind(function=func.__name__, code=error.code).warning("")
            raise
        except Exception:
            logger.bind(function=func.__name__).exception("")
            raise

    return wrapper
