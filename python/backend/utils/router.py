import contextlib
import functools
from collections.abc import Awaitable, Callable
from typing import ParamSpec, TypeVar

from fastapi import WebSocket

from shared.utils.error import UnexpectedErrorCode, WSError, handle_ws_error


P = ParamSpec("P")
T = TypeVar("T")


def ws_router[**P, T](
    func: Callable[P, Awaitable[T]],
) -> Callable[P, Awaitable[T | None]]:
    @functools.wraps(func)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> T | None:
        ws = next((arg for arg in args if isinstance(arg, WebSocket)), None)
        if ws is None:
            ws = kwargs.get("ws")
        if not isinstance(ws, WebSocket):
            raise RuntimeError("No WebSocket")

        close_code: int | None = None
        close_reason: str | None = None

        try:
            return await func(*args, **kwargs)
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
