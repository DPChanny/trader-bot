from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.utils.db import cleanup_db, setup_db
from shared.utils.env import get_app_origin, get_log_dir
from shared.utils.error import (
    HTTPError,
    UnexpectedErrorCode,
    ValidationErrorCode,
    handle_http_error,
)
from shared.utils.logging import HTTPLogger, WSLogger, setup_logging
from shared.utils.redis import cleanup_redis, setup_redis

from .auction.auction_manager import AuctionManager
from .routers import (
    auction_router,
    auth_router,
    billing_router,
    guild_router,
    member_router,
    payment_router,
    position_router,
    preset_member_position_router,
    preset_member_router,
    preset_router,
    subscription_router,
    tier_router,
    user_router,
)
from .subscription_manager import SubscriptionManager


setup_logging(log_dir=get_log_dir() or Path(__file__).resolve().parent / "logs")


@asynccontextmanager
async def lifespan(_):
    await setup_redis()
    await setup_db()
    await AuctionManager.setup()
    await SubscriptionManager.setup()

    yield

    await SubscriptionManager.cleanup()
    await AuctionManager.cleanup()
    await cleanup_db()
    await cleanup_redis()


app = FastAPI(title="Trader Bot API", version="0.5.0a0", lifespan=lifespan)


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
app.include_router(subscription_router, prefix="/api")
app.include_router(billing_router, prefix="/api")
app.include_router(payment_router, prefix="/api")
