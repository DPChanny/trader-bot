import functools
import inspect

from loguru import logger

from .error import AppError, ServerErrorCode


class _ServiceLogger:
    def __init__(self) -> None:
        self.entries: list[dict[str, object]] = []

    def bind(self, **kwargs):
        self.entries.append(kwargs)
        return self


def service(func):
    sig = inspect.signature(func)
    accepts_logger = "logger" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        service_logger = _ServiceLogger()
        if accepts_logger and "logger" not in kwargs:
            kwargs["logger"] = service_logger

        try:
            result = await func(*args, **kwargs)
            if accepts_logger and service_logger.entries:
                for entry in service_logger.entries:
                    logger.bind(function=func.__name__, **entry).info("")
            elif accepts_logger:
                logger.bind(function=func.__name__).info("")
            return result
        except AppError as error:
            error.function = func.__name__
            raise
        except Exception as error:
            app_error = AppError(ServerErrorCode.InternalError)
            app_error.function = func.__name__
            raise app_error from error

    return wrapper
