import functools

from loguru import logger

from shared.error import AppError, Server


def service_exception_handler(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except AppError as e:
            if e.status_code < 500:
                logger.bind(error_code=e.code).warning(f"{func.__name__}: [{e.code}]")
            else:
                logger.bind(error_code=e.code).error(f"{func.__name__}: [{e.code}]")
            raise
        except Exception as e:
            logger.exception(f"Unhandled exception in {func.__name__}: {e}")
            raise AppError(Server.InternalError) from None

    return wrapper
