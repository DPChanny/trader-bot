import contextlib
import functools
import inspect
from collections.abc import Awaitable, Callable
from typing import ParamSpec, TypeVar

from fastapi import WebSocket

from .db import get_session
from .error import UnexpectedErrorCode, WSError, handle_ws_error


P = ParamSpec("P")
T = TypeVar("T")


def router[**P, T](func: Callable[P, Awaitable[T]]) -> Callable[P, Awaitable[T]]:
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
        has_session = False
        result: T | None = None
        async for session in get_session():
            has_session = True
            result = await func(*args, session=session, **kwargs)

        if not has_session:
            raise RuntimeError("No Session")
        return result

    signature = inspect.signature(func)
    wrapper.__signature__ = signature.replace(
        parameters=[
            parameter
            for parameter_name, parameter in signature.parameters.items()
            if parameter_name != "session"
        ]
    )

    return wrapper


def bot_router[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T | None]]:
    routed_func = router(func)

    @functools.wraps(routed_func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        return await routed_func(*args, **kwargs)

    return wrapper


def ws_router[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T | None]]:
    routed_func = router(func)

    @functools.wraps(routed_func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        ws = next((arg for arg in args if isinstance(arg, WebSocket)), None)
        if ws is None:
            ws = kwargs.get("ws")
        if not isinstance(ws, WebSocket):
            raise RuntimeError("No WebSocket")

        close_code: int | None = None
        close_reason: str | None = None

        try:
            return await routed_func(*args, **kwargs)
        except WSError as error:
            handle_ws_error(error)
            close_code = 4000
            close_reason = str(error.code)
            return None
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            ws_error.__cause__ = error
            handle_ws_error(ws_error)
            close_code = 4000
            close_reason = str(ws_error.code)
            return None
        finally:
            with contextlib.suppress(Exception):
                await ws.close(code=close_code, reason=close_reason)

    return wrapper
