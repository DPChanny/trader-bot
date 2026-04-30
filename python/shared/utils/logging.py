import json
import logging
import sys
from contextlib import asynccontextmanager
from contextvars import ContextVar
from copy import deepcopy
from dataclasses import dataclass
from datetime import UTC
from enum import StrEnum
from pathlib import Path
from time import perf_counter
from typing import Any
from uuid import uuid4

from loguru import logger
from pydantic import BaseModel
from starlette.datastructures import Headers
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp, Receive, Scope, Send

from .env import get_log_file, get_log_level, get_log_text


_REDACT_KEYS = {"accesstoken", "refreshtoken", "exchangetoken"}
_QUERY_PARAMS_REDACT_KEYS = {"code", "state", "statetoken", "exchangetoken"}


type JSONPrimitive = str | int | float | bool | None
type JSONValue = (
    JSONPrimitive | tuple[JSONPrimitive, ...] | list[JSONValue] | dict[str, JSONValue]
)
type LogValue = JSONValue | BaseModel


def _redact(value: LogValue, keys: list = _REDACT_KEYS) -> Any:
    if isinstance(value, BaseModel):
        return _redact(value.model_dump(mode="json", exclude_unset=True), keys=keys)

    if isinstance(value, dict):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            normalized_key = key.replace("_", "").replace("-", "").lower()

            if normalized_key == "queryparams":
                redacted[key] = _redact(item, keys=_QUERY_PARAMS_REDACT_KEYS)
            elif normalized_key in keys:
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = _redact(item, keys=keys)

        return redacted

    if isinstance(value, list):
        result = [_redact(item, keys=keys) for item in value[:3]]
        if len(value) > 3:
            result.append("[TRUNCATED]")
        return result

    if isinstance(value, tuple):
        result = tuple(_redact(item, keys=keys) for item in value[:3])
        return (*result, "[TRUNCATED]") if len(value) > 3 else result

    return value


@dataclass
class Event:
    class Type(StrEnum):
        HTTP_SERVICE = "http_service"
        BOT_SERVICE = "bot_service"
        WS_SERVICE = "ws_service"
        AUCTION_SERVICE = "auction_service"
        ERROR = "error"
        HTTP_MIDDLEWARE = "http_middleware"
        WS_MIDDLEWARE = "ws_middleware"

    type: Type
    input: LogValue | None = None
    result: LogValue | None = None
    detail: LogValue | None = None

    def __iter__(self):
        yield "type", self.type.value
        if self.input is not None:
            yield "input", _redact(self.input)
        if self.result is not None:
            yield "result", _redact(self.result)
        if self.detail is not None:
            yield "detail", _redact(self.detail)


_logging_context = ContextVar("_logging_context", default=None)


@asynccontextmanager
async def logging_context(value: LogValue):
    token = _logging_context.set(value)
    try:
        yield
    finally:
        _logging_context.reset(token)


def _patcher(record: dict[str, Any]) -> None:
    log_file = get_log_file()
    log_text = get_log_text()

    if not log_file and not log_text:
        return

    extra = dict(record["extra"])

    event = extra.pop("event", None)
    event = dict(event) if isinstance(event, Event) else None

    source = extra.pop("_source", None)
    if not isinstance(source, str) or not source:
        source = f"{record['name']}:{record['function']}:{record['line']}"
    timestamp = (
        record["time"].astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    )

    log: dict[str, Any] = {
        "timestamp": timestamp,
        "level": record["level"].name,
        "source": source,
    }
    context = _logging_context.get()
    if record["message"]:
        log["message"] = record["message"]
    if event is not None:
        log["event"] = event
    if context is not None:
        log["context"] = _redact(context)
    if extra:
        log["extra"] = extra

    if log_file:
        record["extra"]["json"] = json.dumps(log, ensure_ascii=False, default=str)

    if not log_text:
        return

    parts = [f"{timestamp} | {log['level']:<8} | {source}"]
    if "message" in log:
        parts.append(log["message"])
    if extra:
        parts.append(json.dumps(extra, ensure_ascii=False, default=str))
    text = " | ".join(parts)

    if "context" in log:
        text += "\ncontext:\n" + json.dumps(
            log["context"], ensure_ascii=False, indent=2, default=str
        )

    if event is not None:
        event = deepcopy(event)
        detail = event.get("detail")
        traceback: str | None = None
        if isinstance(detail, dict):
            traceback = detail.pop("traceback", None)

        text += "\nevent:\n" + json.dumps(
            event, ensure_ascii=False, indent=2, default=str
        )
        if traceback:
            text += "\ntraceback:\n" + traceback

    record["extra"]["text"] = text


class _LoguruHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        message = record.getMessage()
        source = f"{record.name}:{record.funcName}:{record.lineno}"

        try:
            level = logger.level(record.levelname).name
        except Exception:
            level = record.levelno

        logger.bind(_source=source).opt(exception=record.exc_info).log(level, message)


def setup_logging(log_dir: str | Path) -> None:
    log_level = get_log_level()
    logger.remove()
    logger.configure(patcher=_patcher)

    resolved_log_dir = Path(log_dir)
    resolved_log_dir.mkdir(parents=True, exist_ok=True)
    log_name = resolved_log_dir / "log.log"

    if get_log_file():
        logger.add(
            str(log_name),
            level=log_level,
            format="{extra[json]}",
            rotation="64 MB",
            retention="7 days",
            compression="zip",
            enqueue=True,
            backtrace=False,
            diagnose=False,
        )

    if get_log_text():
        logger.add(
            sys.stderr,
            level=log_level,
            format="{extra[text]}",
            enqueue=True,
            backtrace=False,
            diagnose=False,
        )

    logging.root.handlers = [_LoguruHandler()]
    logging.root.setLevel(logging.NOTSET)

    for name in list(logging.root.manager.loggerDict.keys()):
        log = logging.getLogger(name)
        log.handlers = []
        log.propagate = True

    logging.getLogger("httpx").setLevel(logging.WARNING)

    for logger_name in ("aiobotocore.credentials", "uvicorn.access"):
        target_logger = logging.getLogger(logger_name)
        target_logger.handlers = []
        target_logger.propagate = False
        target_logger.disabled = True


class HTTPLogger(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("x-request-id") or str(uuid4())
        latency_counter = perf_counter()

        forwarded_for = request.headers.get("x-forwarded-for")
        detail: dict[str, Any] = {
            "http": {
                "request": {
                    "id": request_id,
                    "path": request.url.path,
                    "method": request.method,
                    "user": {
                        "ip": forwarded_for.split(",", maxsplit=1)[0].strip()
                        if forwarded_for
                        else request.client.host,
                        "agent": request.headers.get("user-agent"),
                    },
                }
            }
        }

        if request.query_params:
            detail["http"]["request"]["query_params"] = {
                key: values[0] if len(values) == 1 else values
                for key in request.query_params
                if (values := request.query_params.getlist(key))
            }

        response: Response | None = None
        async with logging_context({"http": {"request": {"id": request_id}}}):
            try:
                response = await call_next(request)
                response.headers["X-Request-ID"] = request_id
                return response
            finally:
                latency_ms = round((perf_counter() - latency_counter) * 1000, 2)
                status_code = response.status_code if response is not None else 500

                detail["http"]["response"] = {
                    "status_code": status_code,
                    "latency_ms": latency_ms,
                }

                if request.method == "OPTIONS":
                    level = "DEBUG"
                elif status_code >= 500:
                    level = "ERROR"
                elif latency_ms >= 1000:
                    level = "WARNING"
                else:
                    level = "INFO"

                logger.bind(event=Event(Event.Type.HTTP_MIDDLEWARE, detail=detail)).log(
                    level, ""
                )


class WSLogger:
    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "websocket":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        request_id = headers.get("x-request-id") or str(uuid4())
        latency_counter = perf_counter()

        forwarded_for = headers.get("x-forwarded-for")
        client = scope.get("client")
        detail: dict[str, Any] = {
            "ws": {
                "request": {
                    "id": request_id,
                    "path": scope.get("path", ""),
                    "user": {
                        "ip": forwarded_for.split(",", maxsplit=1)[0].strip()
                        if forwarded_for
                        else (client[0] if client else None),
                        "agent": headers.get("user-agent"),
                    },
                }
            }
        }

        close_code: int | None = None

        async def _receive() -> dict:
            message = await receive()
            if message.get("type") == "websocket.disconnect":
                nonlocal close_code
                close_code = message.get("code")
            return message

        async def _send(message: dict) -> None:
            if message.get("type") == "websocket.close":
                nonlocal close_code
                close_code = message.get("code")
            await send(message)

        async with logging_context({"ws": {"request": {"id": request_id}}}):
            try:
                await self.app(scope, _receive, _send)
            finally:
                latency_ms = round((perf_counter() - latency_counter) * 1000, 2)
                detail["ws"]["response"] = {
                    "close_code": close_code,
                    "duration_ms": latency_ms,
                }
                level = "WARNING" if close_code == 4000 else "INFO"
                logger.bind(event=Event(Event.Type.WS_MIDDLEWARE, detail=detail)).log(
                    level, ""
                )
