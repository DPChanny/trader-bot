import functools
import inspect
import logging
import traceback

from fastapi import HTTPException


logger = logging.getLogger(__name__)


def _handle(e: Exception, db=None) -> None:
    if db is not None:
        db.rollback()

    error_trace = traceback.format_exc()

    logger.error("=" * 80)
    logger.error(f"UNEXPECTED EXCEPTION: {e}")
    logger.error("-" * 80)
    logger.error(error_trace)
    logger.error("=" * 80)

    if isinstance(e, HTTPException):
        raise e
    raise HTTPException(status_code=500, detail=str(e))


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
