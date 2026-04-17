import json
import logging
import time
import traceback
from datetime import UTC
from pathlib import Path
from uuid import uuid4

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def _build_log(record) -> dict:
    extra = dict(record["extra"])
    event = extra.pop("event", None)
    request = extra.pop("request", None)
    event = event if isinstance(event, dict) else None

    source = f"{record['name']}:{record['function']}:{record['line']}"

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
        data["extra"] = extra
    if record["exception"]:
        data["exception"] = "".join(traceback.format_exception(*record["exception"]))
    return data


def _json_formatter(record) -> str:
    return json.dumps(_build_log(record), ensure_ascii=False)


def _text_formatter(record) -> str:
    data = _build_log(record)

    parts = [f"{data['timestamp']} | {data['level']:<8} | {data['source']}"]
    if "message" in data:
        parts.append(data["message"])
    if "extra" in data:
        parts.append(json.dumps(data["extra"], ensure_ascii=False, default=str))

    output = " | ".join(parts)
    if "event" in data:
        output += "\n" + json.dumps(
            data["event"], ensure_ascii=False, indent=2, default=str
        )
    if "request" in data:
        output += "\n" + json.dumps(
            data["request"], ensure_ascii=False, indent=2, default=str
        )
    if "exception" in data:
        output = f"{output}\n{data['exception']}"

    return output


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


def setup_logging(log_dir: str | Path, log_name: str) -> None:
    from .env import get_log_format, get_log_level

    log_level = get_log_level()
    log_format = get_log_format()
    logger.remove()

    resolved_log_dir = Path(log_dir)
    resolved_log_dir.mkdir(parents=True, exist_ok=True)
    log_name = resolved_log_dir / log_name

    logger.add(
        str(log_name),
        level=log_level,
        format=_json_formatter if log_format == "json" else _text_formatter,
        rotation="10 MB",
        retention="7 days",
        compression="zip",
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
