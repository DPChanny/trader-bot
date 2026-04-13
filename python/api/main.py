from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from shared.utils.database import setup_db
from shared.utils.env import get_app_origin
from shared.utils.error import AppError, UnexpectedErrorCode, ValidationErrorCode
from shared.utils.logging import LoggingMiddleware, setup_logging

from .routers import (
    auction_router,
    auction_websocket_router,
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


setup_logging()


@asynccontextmanager
async def lifespan(_):
    await setup_db()
    yield


app = FastAPI(title="Trader API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    function = exc.function or app_error_handler.__name__
    if exc.status_code < 500:
        logger.bind(function=function, error_code=exc.code).warning("")
    else:
        logger.opt(exception=exc.__cause__).bind(
            function=function, error_code=exc.code
        ).error("")

    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    app_error = AppError(ValidationErrorCode.Invalid)
    app_error.function = validation_error_handler.__name__
    app_error.__cause__ = exc
    return await app_error_handler(request, app_error)


@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception) -> JSONResponse:
    app_error = AppError(UnexpectedErrorCode.Internal)
    app_error.function = exception_handler.__name__
    app_error.__cause__ = exc
    return await app_error_handler(request, app_error)


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
app.include_router(auction_websocket_router, prefix="/ws")
