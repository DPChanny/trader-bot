from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from loguru import logger

from shared.utils.database import setup_db
from shared.utils.logging import LoggingMiddleware, setup_logging

from .routers import (
    admin_router,
    auction_router,
    auction_websocket_router,
    lol_stat_router,
    position_router,
    preset_router,
    preset_user_position_router,
    preset_user_router,
    tier_router,
    user_router,
    val_stat_router,
)


setup_logging()


@asynccontextmanager
async def lifespan(_):
    setup_db()

    yield


app = FastAPI(title="Trader API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(_, exc):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.add_middleware(LoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(user_router, prefix="/api")
app.include_router(position_router, prefix="/api")
app.include_router(preset_router, prefix="/api")
app.include_router(tier_router, prefix="/api")
app.include_router(preset_user_router, prefix="/api")
app.include_router(preset_user_position_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(lol_stat_router, prefix="/api")
app.include_router(val_stat_router, prefix="/api")
app.include_router(auction_router, prefix="/api")
app.include_router(auction_websocket_router, prefix="/ws")
