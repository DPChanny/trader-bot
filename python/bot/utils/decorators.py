import functools
from collections.abc import Awaitable, Callable
from typing import ParamSpec, TypeVar

from loguru import logger

from shared.error import AppError
from shared.utils.database import get_session


P = ParamSpec("P")
T = TypeVar("T")


def with_session[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T]]:
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        async for session in get_session():
            return await func(*args, session=session, **kwargs)

        raise RuntimeError("Session provider yielded no session")

    return wrapper


def with_error_handler[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T | None]]:
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        try:
            return await func(*args, **kwargs)
        except AppError:
            return None
        except Exception as e:
            logger.bind(
                event=func.__name__,
                exception_type=type(e).__name__,
            ).exception("")
            return None

    return wrapper
