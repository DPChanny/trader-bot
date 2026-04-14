import json
import logging
import sys
import time
from datetime import UTC
from uuid import uuid4

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def _pop_extra(record) -> tuple[dict, str | None, dict | None, dict | None]:
    extra = dict(record["extra"])
    function = extra.pop("function", None)
    event = extra.pop("event", None)
    request = extra.pop("request", None)
    return extra, function, event, request


def _json_sink(message) -> None:
    record = message.record
    extra, function, event, request = _pop_extra(record)

    source = function or f"{record['name']}:{record['function']}:{record['line']}"
    data: dict = {
        "timestamp": record["time"]
        .astimezone(UTC)
        .strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3]
        + "Z",
        "level": record["level"].name,
        "source": source,
    }
    if record["message"]:
        data["message"] = record["message"]

    if event is not None:
        data["event"] = event
    if request is not None:
        data["request"] = request
    if extra:
        data.update(extra)
    if record["exception"]:
        import traceback

        data["exception"] = "".join(traceback.format_exception(*record["exception"]))
    print(json.dumps(data, ensure_ascii=False), flush=True)


def _text_sink(message) -> None:
    record = message.record
    timestamp = record["time"].strftime("%Y-%m-%d %H:%M:%S.%f")[:-3]
    extra, function, event, request = _pop_extra(record)

    source = function or f"{record['name']}:{record['function']}:{record['line']}"

    parts = [f"{timestamp} | {record['level'].name:<8} | {source}"]
    if extra:
        parts.append(json.dumps(extra, ensure_ascii=False, default=str))
    if record["message"]:
        parts.append(record["message"])

    output = " | ".join(parts)
    if event is not None:
        output += "\n" + json.dumps(event, ensure_ascii=False, indent=2, default=str)
    if request is not None:
        output += "\n" + json.dumps(request, ensure_ascii=False, indent=2, default=str)
    if record["exception"]:
        import traceback

        output = (
            f"{output}\n{''.join(traceback.format_exception(*record['exception']))}"
        )

    print(output, file=sys.stdout, flush=True)


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
                logger.bind(
                    request={
                        "method": request.method,
                        "route": request.url.path,
                        "status_code": status_code,
                        "duration": duration,
                    }
                ).info("")
