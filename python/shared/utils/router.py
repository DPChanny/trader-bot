import contextlib
import functools
import inspect
from collections.abc import Awaitable, Callable
from typing import ParamSpec, TypeVar

from fastapi import WebSocket

from .database import get_session
from .error import (
    AppError,
    UnexpectedErrorCode,
    WSError,
    handle_app_error,
    handle_ws_error,
)


P = ParamSpec("P")
T = TypeVar("T")


def router[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T]]:
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

    return wrapper


def bot_router[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T | None]]:
    routed_func = router(func)

    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        try:
            return await routed_func(*args, **kwargs)
        except AppError as error:
            handle_app_error(error, func.__name__)
            return None
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            app_error.__cause__ = error
            handle_app_error(app_error, func.__name__)
            return None

    return wrapper


def ws_router[**P, T](
    send_error_message: Callable[[WebSocket, int], Awaitable[None]],
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T | None]]]:
    def decorator(
        func: Callable[P, Awaitable[T]],
    ) -> Callable[P, Awaitable[T | None]]:
        routed_func = router(func)

        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
            ws = next((arg for arg in args if isinstance(arg, WebSocket)), None)
            if ws is None:
                ws = kwargs.get("ws")
            if not isinstance(ws, WebSocket):
                raise RuntimeError("No WebSocket")

            try:
                return await routed_func(*args, **kwargs)
            except WSError as error:
                await handle_ws_error(
                    error,
                    func.__name__,
                    lambda code: send_error_message(ws, code),
                )
                with contextlib.suppress(Exception):
                    await ws.close(code=4000, reason=str(error.code))
                return None
            except Exception as error:
                ws_error = WSError(UnexpectedErrorCode.Internal)
                ws_error.function = func.__name__
                ws_error.__cause__ = error
                await handle_ws_error(
                    ws_error,
                    func.__name__,
                    lambda code: send_error_message(ws, code),
                )
                with contextlib.suppress(Exception):
                    await ws.close(code=4000, reason=str(ws_error.code))
                return None

        signature = inspect.signature(func)
        wrapper.__signature__ = signature.replace(
            parameters=[
                parameter
                for parameter_name, parameter in signature.parameters.items()
                if parameter_name != "session"
            ]
        )

        return wrapper

    return decorator
