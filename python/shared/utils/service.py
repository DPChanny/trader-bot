import functools
import inspect

from .error import AppError, Server
from .logging import bind_target_func


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
        logger = bind_target_func(func)
        service_logger = _ServiceLogger()
        if accepts_logger and "logger" not in kwargs:
            kwargs["logger"] = service_logger

        try:
            result = await func(*args, **kwargs)
            if accepts_logger and service_logger.entries:
                for entry in service_logger.entries:
                    logger.bind(**entry).info("")
            elif accepts_logger:
                logger.info("")
            return result
        except AppError as error:
            if error.status_code < 500:
                logger.bind(error_code=error.code).warning("")
            else:
                logger.bind(error_code=error.code).error("")
            raise
        except Exception as error:
            logger.bind(
                exception_type=type(error).__name__,
            ).exception("")
            raise AppError(Server.InternalError) from None

    return wrapper
