from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.utils.db import close_db, setup_db
from shared.utils.env import get_app_origin
from shared.utils.error import (
    HTTPError,
    UnexpectedErrorCode,
    ValidationErrorCode,
    handle_http_error,
)
from shared.utils.logging import HTTPLogger, WSLogger, setup_logging
from shared.utils.redis import close_redis, setup_redis

from .auction.auction_manager import AuctionManager
from .routers import (
    auction_router,
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


setup_logging(log_dir=Path(__file__).resolve().parent / "logs")


@asynccontextmanager
async def lifespan(_):
    await setup_redis()
    await setup_db()
    await AuctionManager.setup()

    yield

    await AuctionManager.cleanup()
    await close_db()
    await close_redis()


app = FastAPI(title="Trader Bot API", version="0.4.0", lifespan=lifespan)


@app.exception_handler(HTTPError)
async def http_error_handler(_: Request, exc: HTTPError) -> JSONResponse:
    return handle_http_error(exc)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    error = HTTPError(ValidationErrorCode.Invalid)
    error.__cause__ = exc
    return handle_http_error(error)


@app.exception_handler(Exception)
async def exception_handler(_: Request, exc: Exception) -> JSONResponse:
    error = HTTPError(UnexpectedErrorCode.Internal)
    error.__cause__ = exc
    return handle_http_error(error)


app.add_middleware(HTTPLogger)
app.add_middleware(WSLogger)
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
