import functools
import inspect
from dataclasses import dataclass, field
from json import JSONDecodeError
from typing import Any

from loguru import logger
from pydantic import ValidationError

from .error import AppError, HTTPError, UnexpectedErrorCode, WSError


@dataclass(slots=True)
class ServiceEvent:
    name: str
    entity: dict[str, Any] = field(default_factory=dict)
    summary: dict[str, Any] = field(default_factory=dict)

    # Backward compatibility for code that still references event.dto.
    @property
    def dto(self) -> dict[str, Any]:
        return self.entity

    @dto.setter
    def dto(self, value: dict[str, Any]) -> None:
        self.entity = value

    def __ior__(self, other):
        if isinstance(other, dict):
            self.entity |= other
            return self
        raise TypeError("ServiceEvent supports only dict merge with '|='")

    def to_log_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "entity": self.entity,
            "summary": self.summary,
        }


def http_service(func):
    sig = inspect.signature(func)
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: ServiceEvent | None = None
        if has_event:
            if not isinstance(kwargs.get("event"), ServiceEvent):
                kwargs["event"] = ServiceEvent(name=func.__name__)
            event = kwargs["event"]

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(event=event.to_log_dict()).info("")
            return result
        except HTTPError as error:
            if error.function is None:
                error.function = func.__name__
            raise
        except Exception as error:
            http_error = HTTPError(UnexpectedErrorCode.Internal)
            http_error.function = func.__name__
            raise http_error from error

    return wrapper


def bot_service(func):
    sig = inspect.signature(func)
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: ServiceEvent | None = None
        if has_event:
            if not isinstance(kwargs.get("event"), ServiceEvent):
                kwargs["event"] = ServiceEvent(name=func.__name__)
            event = kwargs["event"]

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(event=event.to_log_dict()).info("")
            return result
        except AppError as error:
            if error.function is None:
                error.function = func.__name__
            raise
        except Exception as error:
            app_error = AppError(UnexpectedErrorCode.Internal)
            app_error.function = func.__name__
            raise app_error from error

    return wrapper


def ws_service(func):
    sig = inspect.signature(func)
    has_event = "event" in sig.parameters

    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        event: ServiceEvent | None = None
        if has_event:
            if not isinstance(kwargs.get("event"), ServiceEvent):
                kwargs["event"] = ServiceEvent(name=func.__name__)
            event = kwargs["event"]

        try:
            result = await func(*args, **kwargs)
            if has_event:
                logger.bind(event=event.to_log_dict()).info("")
            return result
        except WSError as error:
            if error.function is None:
                error.function = func.__name__
            raise
        except (ValidationError, JSONDecodeError):
            raise
        except Exception as error:
            ws_error = WSError(UnexpectedErrorCode.Internal)
            ws_error.function = func.__name__
            raise ws_error from error

    return wrapper
