import contextlib
import functools
import inspect

from fastapi import HTTPException
from loguru import logger


def service_exception_handler(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()
            db = bound.arguments.get("db")
            if db is not None:
                with contextlib.suppress(Exception):
                    await db.rollback()
            if isinstance(e, HTTPException):
                if e.status_code < 500:
                    logger.warning(f"{func.__name__}: {e.status_code} {e.detail}")
                else:
                    logger.error(f"{func.__name__}: {e.status_code} {e.detail}")
                raise e
            logger.exception(f"Unhandled exception: {e}")
            raise HTTPException(
                status_code=500, detail="Internal server error"
            ) from None

    return wrapper
