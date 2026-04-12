import json
import logging
import sys
import time
from collections.abc import Callable
from uuid import uuid4

from loguru import logger
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


def bind_target_func(
    target_func: str | Callable[..., object],
    **kwargs,
):
    _target_func = target_func
    if not isinstance(target_func, str):
        _target_func = target_func.__name__

    return logger.bind(
        target_func=_target_func,
        **kwargs,
    )


class LoguruHandler(logging.Handler):
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
    data: dict = {
        "timestamp": record["time"].strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z",
        "level": record["level"].name,
        "module": record["name"],
        "function": record["function"],
        "line": record["line"],
        "message": record["message"],
    }
    data.update(record["extra"])
    if record["exception"]:
        import traceback

        data["exception"] = "".join(traceback.format_exception(*record["exception"]))
    print(json.dumps(data, ensure_ascii=False), flush=True)


def setup_logging() -> None:
    from .env import get_log_format, get_log_level

    log_level = get_log_level()
    log_format = get_log_format()
    logger.remove()

    if log_format == "json":
        logger.add(_json_sink, level=log_level)
    else:
        logger.add(
            sys.stdout,
            level=log_level,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {name}:{function}:{line} | {message}",
            colorize=True,
        )

    logging.root.handlers = [LoguruHandler()]
    logging.root.setLevel(logging.NOTSET)

    for name in list(logging.root.manager.loggerDict.keys()):
        log = logging.getLogger(name)
        log.handlers = []
        log.propagate = True


class LoguruMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = str(uuid4())
        start = time.perf_counter()

        with logger.contextualize(request_id=request_id):
            response = await call_next(request)
            duration = round((time.perf_counter() - start) * 1000)
            logger.bind(
                method=request.method,
                route=request.url.path,
                response=response.status_code,
                duration=duration,
            ).info("")
            response.headers["X-Request-ID"] = request_id
            return response
