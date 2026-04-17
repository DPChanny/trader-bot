import json
import logging
import sys
import time
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
type JSONPrimitiveTuple = tuple[JSONPrimitive, ...]
type JSONValue = (
    JSONPrimitive | JSONPrimitiveTuple | list[JSONValue] | dict[str, JSONValue]
)
type LogValue = JSONValue | BaseModel


def redact(value: Any) -> Any:
    if isinstance(value, dict):
        redacted: dict[str, Any] = {}
        for key, item in value.items():
            if isinstance(key, str) and key in REDACT_KEYS:
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = redact(item)
        return redacted

    if isinstance(value, list):
        redacted = [redact(item) for item in value[:3]]
        if len(value) > 3:
            redacted.append("[REDACTED]")
        return redacted

    if isinstance(value, tuple):
        redacted = tuple(redact(item) for item in value[:3])
        if len(value) > 3:
            return (*redacted, "[REDACTED]")
        return redacted

    if isinstance(value, BaseModel):
        return redact(value.model_dump(mode="json", exclude_unset=True))

    return value


@dataclass
class Event:
    function: str
    request: LogValue | None = None
    result: LogValue | None = None
    detail: LogValue | None = None

    def __iter__(self):
        yield "function", self.function
        yield ("request", redact(self.request))
        yield ("result", redact(self.result))
        yield ("detail", redact(self.detail))


def _patcher(record: dict[str, Any]) -> None:
    log_file = get_log_file()
    log_text = get_log_text()

    if not log_file and not log_text:
        return

    extra = dict(record["extra"])
    event = extra.pop("event", None)
    request = extra.pop("request", None)
    if isinstance(event, Event):
        event = dict(event)
    elif not isinstance(event, dict):
        event = None

    source = f"{record['name']}:{record['function']}:{record['line']}"

    log = {
        "timestamp": record["time"]
        .astimezone(UTC)
        .strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]
        + "Z",
        "level": record["level"].name,
        "source": source,
    }

    if record["message"]:
        log["message"] = record["message"]
    if event is not None:
        log["event"] = event
    if request is not None:
        log["request"] = request
    if extra:
        log["extra"] = extra

    if log_file:
        record["extra"]["json"] = json.dumps(log, ensure_ascii=False, default=str)

    if not log_text:
        return

    parts = [f"{log['timestamp']} | {log['level']:<8} | {log['source']}"]
    if "message" in log:
        parts.append(log["message"])
    if "extra" in log:
        parts.append(json.dumps(log["extra"], ensure_ascii=False, default=str))

    text = " | ".join(parts)
    if "event" in log:
        text += "\n" + json.dumps(
            log["event"], ensure_ascii=False, indent=2, default=str
        )
    if "request" in log:
        text += "\n" + json.dumps(
            log["request"], ensure_ascii=False, indent=2, default=str
        )

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
        start = time.perf_counter()
        response: Response | None = None
        status_code = 500

        with logger.contextualize(request_id=request_id):
            try:
                response = await call_next(request)
                status_code = response.status_code
                response.headers["X-Request-ID"] = request_id
                return response
            finally:
                duration = round((time.perf_counter() - start) * 1000)
                forwarded_for = request.headers.get("x-forwarded-for")
                client_ip = (
                    forwarded_for.split(",", maxsplit=1)[0].strip()
                    if forwarded_for
                    else request.client.host
                    if request.client is not None
                    else None
                )
                logger.bind(
                    request={
                        "method": request.method,
                        "path": request.url.path,
                        "query": request.url.query,
                        "client_ip": client_ip,
                        "user_agent": request.headers.get("user-agent"),
                        "status_code": status_code,
                        "duration": duration,
                    }
                ).info("")
