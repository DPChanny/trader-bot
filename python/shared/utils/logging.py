import json
import logging
import sys
import time
from contextvars import ContextVar
from datetime import UTC
from uuid import uuid4

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


_pending_extra: ContextVar[dict | None] = ContextVar("_pending_extra", default=None)


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


def _json_sink(message) -> None:
    record = message.record
    extra = dict(record["extra"])
    function = extra.pop("function", None)
    data: dict = {
        "timestamp": record["time"]
        .astimezone(UTC)
        .strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]
        + "Z",
        "level": record["level"].name,
        "module": None if function else record["name"],
        "function": function or record["function"],
        "line": None if function else record["line"],
    }
    if record["message"]:
        data["message"] = record["message"]
    event = extra.pop("event", None)
    request = extra.pop("request", None)
    pending_extra = _pending_extra.get()
    if pending_extra is not None and not request:
        if function:
            pending_extra["function"] = function
        if event is not None:
            pending_extra["event"] = event
        pending_extra.update(extra)
        return
    if event:
        data["event"] = event
    if request:
        data["request"] = {**request, **pending_extra} if pending_extra else request
    if extra:
        data.update(extra)
    if record["exception"]:
        import traceback

        data["exception"] = "".join(traceback.format_exception(*record["exception"]))
    print(json.dumps(data, ensure_ascii=False), flush=True)


def _text_sink(message) -> None:
    record = message.record
    timestamp = record["time"].strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    extra = dict(record["extra"])
    function = extra.pop("function", None)
    source = function or f"{record['name']}:{record['function']}:{record['line']}"
    event = extra.pop("event", None)
    request = extra.pop("request", None)
    pending_extra = _pending_extra.get()
    if pending_extra is not None and not request:
        if function:
            pending_extra["function"] = function
        if event is not None:
            pending_extra["event"] = event
        pending_extra.update(extra)
        return
    parts = [
        f"{timestamp} | {record['level'].name:<8} | {source}",
    ]

    if extra:
        parts.append(json.dumps(extra, ensure_ascii=False, default=str))

    if record["message"]:
        parts.append(record["message"])

    output = " | ".join(parts)

    if event:
        output += "\n" + json.dumps(event, ensure_ascii=False, indent=2, default=str)
    if request:
        merged = {**request, **pending_extra} if pending_extra else request
        output += "\n" + json.dumps(merged, ensure_ascii=False, indent=2, default=str)

    if record["exception"]:
        import traceback

        output = (
            f"{output}\n{''.join(traceback.format_exception(*record['exception']))}"
        )

    print(output, file=sys.stdout, flush=True)


def setup_logging() -> None:
    from .env import get_log_format, get_log_level

    log_level = get_log_level()
    log_format = get_log_format()
    logger.remove()

    if log_format == "json":
        logger.add(_json_sink, level=log_level)
    else:
        logger.add(_text_sink, level=log_level)

    logging.root.handlers = [_LoguruHandler()]
    logging.root.setLevel(logging.NOTSET)

    for name in list(logging.root.manager.loggerDict.keys()):
        log = logging.getLogger(name)
        log.handlers = []
        log.propagate = True

    logging.getLogger("uvicorn.access").propagate = False


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid4())
        start = time.perf_counter()

        token = _pending_extra.set({})
        try:
            with logger.contextualize(request_id=request_id):
                response = await call_next(request)
                duration = round((time.perf_counter() - start) * 1000)
                logger.bind(
                    request={
                        "method": request.method,
                        "route": request.url.path,
                        "status_code": response.status_code,
                        "duration": duration,
                    }
                ).info("")
                response.headers["X-Request-ID"] = request_id
                return response
        finally:
            _pending_extra.reset(token)
