from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.utils.database import setup_db
from shared.utils.env import get_app_origin
from shared.utils.error import (
    HTTPError,
    UnexpectedErrorCode,
    ValidationErrorCode,
    handle_http_error,
)
from shared.utils.logging import LoggingMiddleware, setup_logging

from .routers import (
    auction_router,
    auction_ws_router,
    auth_router,
    guild_router,
    member_router,
    position_router,
    preset_member_position_router,
    preset_member_router,
    preset_router,
    tier_router,
    user_router,
)


setup_logging(
    log_dir=Path(__file__).resolve().parent / "logs",
    log_name="{time:YYMMDDHHMMSS}.log",
)


@asynccontextmanager
async def lifespan(_):
    await setup_db()
    yield


app = FastAPI(title="Trader API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(HTTPError)
async def http_error_handler(_: Request, exc: HTTPError) -> JSONResponse:
    return handle_http_error(exc, http_error_handler.__name__)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    error = HTTPError(ValidationErrorCode.Invalid)
    error.function = validation_error_handler.__name__
    error.__cause__ = exc
    return handle_http_error(error, validation_error_handler.__name__)


@app.exception_handler(Exception)
async def exception_handler(_: Request, exc: Exception) -> JSONResponse:
    error = HTTPError(UnexpectedErrorCode.Internal)
    error.function = exception_handler.__name__
    error.__cause__ = exc
    return handle_http_error(error, exception_handler.__name__)


app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[get_app_origin()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/api")
app.include_router(member_router, prefix="/api")
app.include_router(user_router, prefix="/api")
app.include_router(position_router, prefix="/api")
app.include_router(preset_router, prefix="/api")
app.include_router(tier_router, prefix="/api")
app.include_router(preset_member_router, prefix="/api")
app.include_router(preset_member_position_router, prefix="/api")
app.include_router(auction_router, prefix="/api")
app.include_router(guild_router, prefix="/api")
app.include_router(auction_ws_router, prefix="/ws")
