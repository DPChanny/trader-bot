import logging
import signal
import sys
import traceback
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import (
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
from services.discord_service import discord_service
from utils.database import init_engine


logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s - %(name)s - %(message)s",
)

logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("discord").setLevel(logging.WARNING)
logging.getLogger("discord.client").setLevel(logging.WARNING)
logging.getLogger("discord.gateway").setLevel(logging.WARNING)
logging.getLogger("discord.http").setLevel(logging.WARNING)

logger = logging.getLogger(__name__)


def signal_handler(signum, frame):
    logger.info(f"Signal {signum}, shutting down...")

    import asyncio

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    try:
        logger.info("Stopping Discord service...")
        loop.run_until_complete(discord_service.stop())
        logger.info("Discord service stopped")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")
        import traceback

        logger.error(traceback.format_exc())
    finally:
        try:
            loop.close()
        except Exception as e:
            logger.error(f"Error closing event loop: {e}")

    logger.info("Exiting...")
    sys.exit(0)


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
if sys.platform == "win32":
    signal.signal(signal.SIGBREAK, signal_handler)


@asynccontextmanager
async def lifespan(_):
    init_engine()

    await discord_service.start()

    yield

    await discord_service.stop()


app = FastAPI(title="Trader Auction API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(_, exc):
    error_msg = f"Global exception: {exc}"
    error_trace = traceback.format_exc()

    logger.error("=" * 80)
    logger.error(f"ERROR: {error_msg}")
    logger.error("-" * 80)
    logger.error(error_trace)
    logger.error("=" * 80)

    from fastapi.responses import JSONResponse

    return JSONResponse(
        status_code=500, content={"detail": str(exc), "traceback": error_trace}
    )


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
app.include_router(auction_router, prefix="/api")
app.include_router(auction_websocket_router, prefix="/ws")
app.include_router(admin_router, prefix="/api")
app.include_router(lol_stat_router, prefix="/api")
app.include_router(val_stat_router, prefix="/api")


@app.get("/")
def read_root():
    return {"message": "Trader Auction API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}
