from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.error import AppError, Server, Validation
from shared.utils.database import setup_db
from shared.utils.env import get_app_origin
from shared.utils.logging import LoggingMiddleware, bind_target_func, setup_logging

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
    return JSONResponse(
        status_code=exc.status_code,
        content={"code": exc.code},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(
    _: Request, exc: RequestValidationError
) -> JSONResponse:
    bind_target_func(
        validation_error_handler,
        error_code=Validation.Error.value,
        exception_type=type(exc).__name__,
    ).warning("")
    return JSONResponse(
        status_code=422,
        content={"code": Validation.Error.value},
    )


@app.exception_handler(Exception)
async def global_exception_handler(_: Request, exc: Exception) -> JSONResponse:
    bind_target_func(
        global_exception_handler,
        error_code=Server.InternalError.value,
        exception_type=type(exc).__name__,
    ).exception("")
    return JSONResponse(
        status_code=500,
        content={"code": Server.InternalError.value},
    )


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
