import functools
import inspect

from fastapi import HTTPException
from loguru import logger


def _handle(e: Exception, db=None) -> None:
    if db is not None:
        db.rollback()

    if isinstance(e, HTTPException):
        raise e

    logger.exception(f"Unhandled exception: {e}")

    raise HTTPException(status_code=500, detail="Internal server error")


def service_exception_handler(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def async_wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()
            _handle(e, bound.arguments.get("db"))

    @functools.wraps(func)
    def sync_wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()
            _handle(e, bound.arguments.get("db"))

    return async_wrapper if inspect.iscoroutinefunction(func) else sync_wrapper
