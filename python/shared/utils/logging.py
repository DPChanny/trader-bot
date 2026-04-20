import json
import logging
import sys
from contextvars import ContextVar
from dataclasses import dataclass, field
from datetime import UTC
from enum import StrEnum
from pathlib import Path
from time import perf_counter
from typing import Any
from uuid import uuid4

from loguru import logger
from pydantic import BaseModel
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .env import get_log_file, get_log_level, get_log_text


REDACT_KEYS = {"access_token", "refresh_token", "exchange_token"}


type JSONPrimitive = str | int | float | bool | None
type JSONValue = (
    JSONPrimitive | tuple[JSONPrimitive, ...] | list[JSONValue] | dict[str, JSONValue]
)
type LogValue = JSONValue | BaseModel


class EventType(StrEnum):
    HTTP_SERVICE = "http_service"
    BOT_SERVICE = "bot_service"
    WS_SERVICE = "ws_service"
    ERROR = "error"
    HTTP_MIDDLEWARE = "http_middleware"


def _redact(value: LogValue) -> Any:
    if isinstance(value, BaseModel):
        return _redact(value.model_dump(mode="json", exclude_unset=True))
    if isinstance(value, dict):
        return {
            key: "[REDACTED]" if key in REDACT_KEYS else _redact(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        result = [_redact(item) for item in value[:3]]
        if len(value) > 3:
            result.append("[REDACTED]")
        return result
    if isinstance(value, tuple):
        result = tuple(_redact(item) for item in value[:3])
        return (*result, "[REDACTED]") if len(value) > 3 else result

    return value


@dataclass
class Event:
    type: EventType | None = None
    input: LogValue | None = None
    result: LogValue | None = None
    detail: LogValue | None = None
    context: LogValue | None = field(default=None, init=False, repr=False)

    def __iter__(self):
        if self.type is not None:
            yield "type", self.type.value
        if self.input is not None:
            yield "input", _redact(self.input)
        if self.result is not None:
            yield "result", _redact(self.result)
        if self.detail is not None:
            yield "detail", _redact(self.detail)

        context = _context.get()
        if context is not None:
            yield "context", _redact(context)


_context: ContextVar[LogValue | None] = ContextVar("_context", default=None)


def _patcher(record: dict[str, Any]) -> None:
    log_file = get_log_file()
    log_text = get_log_text()

    if not log_file and not log_text:
        return

    extra = dict(record["extra"])
    event = extra.pop("event", None)

    if isinstance(event, Event):
        event = dict(event)
    elif not isinstance(event, dict):
        event = None

    source = f"{record['name']}:{record['function']}:{record['line']}"
    timestamp = (
        record["time"].astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    )

    log: dict[str, Any] = {
        "timestamp": timestamp,
        "level": record["level"].name,
        "source": source,
    }
    if record["message"]:
        log["message"] = record["message"]
    if event is not None:
        log["event"] = event
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

    if event is not None:
        text += "\n" + json.dumps(event, ensure_ascii=False, indent=2, default=str)

    record["extra"]["text"] = text


class _LoguruHandler(logging.Handler):
    def emit(self, record: logging.LogRecord) -> None:
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno

        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        logger.opt(depth=depth, exception=record.exc_info).log(
            level, record.getMessage()
        )


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

    logging.getLogger("uvicorn.access").propagate = False
    logging.getLogger("botocore.credentials").setLevel(logging.WARNING)
    logging.getLogger("botocore").setLevel(logging.WARNING)
    logging.getLogger("boto3").setLevel(logging.WARNING)
    logging.getLogger("urllib3").setLevel(logging.WARNING)


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("x-request-id") or str(uuid4())
        started_at = perf_counter()

        forwarded_for = request.headers.get("x-forwarded-for")
        client_ip = (
            forwarded_for.split(",", maxsplit=1)[0].strip()
            if forwarded_for
            else request.client.host
            if request.client is not None
            else None
        )
        token = _context.set({"http": {"request_id": request_id}})
        response: Response | None = None
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            latency_ms = round((perf_counter() - started_at) * 1000, 2)
            logger.bind(
                event=Event(
                    type=EventType.HTTP_MIDDLEWARE,
                    detail={
                        "http": {
                            "query": request.url.query,
                            "method": request.method,
                            "path": request.url.path,
                            "status_code": response.status_code if response else 500,
                            "latency_ms": latency_ms,
                            "client_ip": client_ip,
                            "user_agent": request.headers.get("user-agent"),
                        }
                    },
                )
            ).info("")
            _context.reset(token)
