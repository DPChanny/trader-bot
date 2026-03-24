from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse
from loguru import logger

from shared.env import get_log_format, get_log_level
from shared.log import RequestContextMiddleware, setup_logging

from .router import bot_router
from .service import bot_service


setup_logging(log_level=get_log_level(), log_format=get_log_format())


@asynccontextmanager
async def lifespan(_):
    await bot_service.start()

    yield

    await bot_service.stop()


app = FastAPI(title="Trader Bot API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(_, exc):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.add_middleware(RequestContextMiddleware)

app.include_router(bot_router)


@app.get("/health")
def health_check():
    return {"status": "healthy"}
