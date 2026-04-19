import json
import logging
import sys
from contextvars import ContextVar
from dataclasses import dataclass
from datetime import UTC
from pathlib import Path
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


def redact(value: LogValue) -> Any:
    if isinstance(value, BaseModel):
        return redact(value.model_dump(mode="json", exclude_unset=True))
    if isinstance(value, dict):
        return {
            key: "[REDACTED]" if key in REDACT_KEYS else redact(item)
            for key, item in value.items()
        }
    if isinstance(value, list):
        result = [redact(item) for item in value[:3]]
        if len(value) > 3:
            result.append("[REDACTED]")
        return result
    if isinstance(value, tuple):
        result = tuple(redact(item) for item in value[:3])
        return (*result, "[REDACTED]") if len(value) > 3 else result

    return value


@dataclass
class Event:
    service: str | None = None
    input: LogValue | None = None
    result: LogValue | None = None
    detail: LogValue | None = None
    error: LogValue | None = None

    def __iter__(self):
        if self.service is not None:
            yield "service", self.service
        if self.input is not None:
            yield "input", redact(self.input)
        if self.result is not None:
            yield "result", redact(self.result)
        if self.detail is not None:
            yield "detail", redact(self.detail)
        if self.error is not None:
            yield "error", redact(self.error)


_http_context: ContextVar[dict[str, Any] | None] = ContextVar(
    "_http_context", default=None
)


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

    if event is not None:
        http = _http_context.get()
        if http is not None:
            event["http"] = http

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

    exception: str | None = None
    if event is not None:
        display_event = dict(event)
        error = display_event.get("error")
        if isinstance(error, dict):
            error = dict(error)
            exception = error.pop("exception", None)
            display_event["error"] = error
        text += "\n" + json.dumps(
            display_event, ensure_ascii=False, indent=2, default=str
        )
    if exception:
        text += "\n" + exception.rstrip()

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

        forwarded_for = request.headers.get("x-forwarded-for")
        client_ip = (
            forwarded_for.split(",", maxsplit=1)[0].strip()
            if forwarded_for
            else request.client.host
            if request.client is not None
            else None
        )
        token = _http_context.set(
            {
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "query": request.url.query,
                "client_ip": client_ip,
                "user_agent": request.headers.get("user-agent"),
            }
        )
        try:
            response = await call_next(request)
            response.headers["X-Request-ID"] = request_id
            return response
        finally:
            _http_context.reset(token)
