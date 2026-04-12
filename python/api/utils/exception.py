import functools

from fastapi import HTTPException
from loguru import logger


def service_exception_handler(func):
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except HTTPException as e:
            if e.status_code < 500:
                logger.warning(f"{func.__name__}: {e.status_code} {e.detail}")
            else:
                logger.error(f"{func.__name__}: {e.status_code} {e.detail}")
            raise
        except Exception as e:
            logger.exception(f"Unhandled exception in {func.__name__}: {e}")
            raise HTTPException(
                status_code=500, detail="Internal server error"
            ) from None

    return wrapper
