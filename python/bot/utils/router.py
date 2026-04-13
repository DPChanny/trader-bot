import functools
from collections.abc import Awaitable, Callable
from typing import ParamSpec, TypeVar

from loguru import logger

from shared.utils.database import get_session
from shared.utils.error import AppError, Server


P = ParamSpec("P")
T = TypeVar("T")


def router[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T | None]]:
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        try:
            async for session in get_session():
                return await func(*args, session=session, **kwargs)

            raise RuntimeError("No Session")
        except AppError as error:
            function = error.function or func.__name__
            if error.status < 500:
                logger.bind(function=function, error_code=error.code).warning("")
            else:
                logger.opt(exception=error.__cause__).bind(
                    function=function, error_code=error.code
                ).error("")
            return None
        except Exception as e:
            if not isinstance(e, AppError):
                app_error = AppError(Server.InternalError)
                app_error.function = func.__name__
                raise app_error from e
            raise

    return wrapper
