from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from loguru import logger

from shared.utils.log import RequestContextMiddleware, setup_logging

from .router import router
from .utils import start_bot, stop_bot


setup_logging()


@asynccontextmanager
async def lifespan(_):
    await start_bot()

    yield

    await stop_bot()


app = FastAPI(title="Trader Bot API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(_, exc):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.add_middleware(RequestContextMiddleware)

app.include_router(router, prefix="/bot")
