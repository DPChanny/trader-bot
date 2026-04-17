import functools
import inspect
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import BaseModel, ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError
from .logging import Event


EXCLUDED_REQUEST_ARG_NAMES = {"session", "ws", "websocket", "bot"}


def _extract_request_dto(
    sig: inspect.Signature, args: tuple[Any, ...], kwargs: dict[str, Any]
) -> dict[str, Any]:
    bound = sig.bind_partial(*args, **kwargs)
    dto_entries: list[tuple[str, BaseModel]] = []

    for name, value in bound.arguments.items():
        if name in EXCLUDED_REQUEST_ARG_NAMES:
            continue

        if name == "dto" and not isinstance(value, BaseModel):
            raise TypeError(f"'{name}' must be a pydantic BaseModel")

        if name == "dto":
            dto_entries.append((name, value))

    if len(dto_entries) == 1:
        return dto_entries[0][1].model_dump(exclude_unset=True)

    if len(dto_entries) > 1:
        return {name: dto.model_dump(exclude_unset=True) for name, dto in dto_entries}

    return {}


def _build_detail(
    sig: inspect.Signature, kwargs: dict[str, Any]
) -> tuple[dict[str, Any], dict[str, Any]]:
    if "detail" not in sig.parameters:
        return kwargs, {}

    injected_kwargs = dict(kwargs)
    detail = injected_kwargs.get("detail")
    if not isinstance(detail, dict):
        detail = {}
        injected_kwargs["detail"] = detail

    return injected_kwargs, detail


def http_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        call_kwargs, detail = _build_detail(sig, kwargs)
        request_dto = _extract_request_dto(sig, args, kwargs)

        try:
            result = await func(*args, **call_kwargs)
            logger.bind(
                event=Event(
                    function=func.__name__,
                    request_dto=request_dto,
                    result_dto=result,
                    detail=detail,
                )
            ).info("succeeded")
            return result
        except HTTPError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request_dto is None:
                error.request_dto = request_dto
            raise
        except Exception as error:
            http_error = HTTPError(UnexpectedErrorCode.Internal)
            http_error.function = func.__name__
            http_error.request_dto = request_dto
            raise http_error from error

    return wrapper


def bot_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        call_kwargs, detail = _build_detail(sig, kwargs)
        request_dto = _extract_request_dto(sig, args, kwargs)

        try:
            result = await func(*args, **call_kwargs)
            logger.bind(
                event=Event(
                    function=func.__name__,
                    request_dto=request_dto,
                    result_dto=result,
                    detail=detail,
                )
            ).info("succeeded")
            return result
        except AppError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request_dto is None:
                error.request_dto = request_dto
            raise
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            app_error.request_dto = request_dto
            raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        call_kwargs, _ = _build_detail(sig, kwargs)
        request_dto = _extract_request_dto(sig, args, kwargs)

        try:
            return await func(*args, **call_kwargs)
        except WSError as error:
            if error.function is None:
                error.function = func.__name__
            if error.request_dto is None:
                error.request_dto = request_dto
            raise
        except (ValidationError, JSONDecodeError):
            raise
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            ws_error.function = func.__name__
            ws_error.request_dto = request_dto
            raise ws_error from error

    return wrapper
