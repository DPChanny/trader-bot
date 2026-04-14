import functools
from collections.abc import Awaitable, Callable
from typing import ParamSpec, TypeVar

from fastapi import WebSocket
from loguru import logger

from .database import get_session
from .error import AppError, UnexpectedErrorCode, WSError, handle_ws_error


P = ParamSpec("P")
T = TypeVar("T")


def bot_router[**P, T](
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
            if error.code < 5000:
                logger.bind(function=function, error_code=error.code).warning("")
            else:
                logger.opt(exception=error.__cause__).bind(
                    function=function, error_code=error.code
                ).error("")
            return None
        except Exception as error:
            logger.opt(exception=error).bind(
                function=func.__name__,
                error_code=UnexpectedErrorCode.Internal.value,
            ).error("")
            return None

    return wrapper


def ws_router[**P, T](
    send_error_message: Callable[[WebSocket, int], Awaitable[None]],
) -> Callable[[Callable[P, Awaitable[T]]], Callable[P, Awaitable[T | None]]]:
    def decorator(
        func: Callable[P, Awaitable[T]],
    ) -> Callable[P, Awaitable[T | None]]:
        @functools.wraps(func)
        async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
            ws = next((arg for arg in args if isinstance(arg, WebSocket)), None)
            if ws is None:
                ws = kwargs.get("ws")
            if not isinstance(ws, WebSocket):
                raise RuntimeError("WebSocket argument is required")

            try:
                async for session in get_session():
                    return await func(*args, session=session, **kwargs)

                raise RuntimeError("No Session")

            except WSError as error:
                await handle_ws_error(
                    error,
                    func.__name__,
                    lambda code: send_error_message(ws, code),
                    lambda code, reason: ws.close(code=code, reason=reason),
                )
                return None

            except Exception as error:
                ws_error = WSError(UnexpectedErrorCode.Internal)
                ws_error.function = func.__name__
                ws_error.__cause__ = error
                await handle_ws_error(
                    ws_error,
                    func.__name__,
                    lambda code: send_error_message(ws, code),
                    lambda code, reason: ws.close(code=code, reason=reason),
                )
                return None

        return wrapper

    return decorator
