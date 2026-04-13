import functools
import inspect

from loguru import logger

from .error import AppError, UnexpectedErrorCode


class _ServiceEvent:
    def __init__(self) -> None:
        self.entries: list[dict[str, object]] = []

    def bind(self, **kwargs):
        self.entries.append(kwargs)
        return self


def service(func):
    sig = inspect.signature(func)
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event = _ServiceEvent()
        if has_event and "event" not in kwargs:
            kwargs["event"] = event

        try:
            result = await func(*args, **kwargs)
            if has_event and event.entries:
                for entry in event.entries:
                    logger.bind(function=func.__name__, **entry).info("")
            elif has_event:
                logger.bind(function=func.__name__).info("")
            return result
        except AppError as error:
            error.function = func.__name__
            raise
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            raise app_error from error

    return wrapper
