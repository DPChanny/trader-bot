import asyncio
import contextlib
from contextlib import asynccontextmanager

import discord
from discord.ext import commands
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from loguru import logger

import bot.service as bot_service
from shared.env import get_discord_bot_token, get_log_format, get_log_level
from shared.log import RequestContextMiddleware, setup_logging

from .router import router


setup_logging(log_level=get_log_level(), log_format=get_log_format())


@asynccontextmanager
async def lifespan(_):
    token = get_discord_bot_token()

    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    bot = commands.Bot(command_prefix="!", intents=intents)
    bot_service._bot = bot

    @bot.event
    async def on_ready():
        logger.info(f"Ready: {bot.user}")

    @bot.event
    async def on_disconnect():
        logger.warning("Disconnected")

    @bot.event
    async def on_error(event, *args, **kwargs):
        logger.exception(f"Discord bot error: event={event}")

    task = asyncio.create_task(bot.start(token, reconnect=True))

    try:
        await asyncio.wait_for(bot.wait_until_ready(), timeout=60.0)
    except asyncio.TimeoutError:
        logger.warning("Startup timeout")

    yield

    try:
        await bot.close()
    except Exception as e:
        logger.exception(f"Discord bot stop error: {e}")

    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task

    logger.info("Stopped")


app = FastAPI(title="Trader Bot API", version="1.0.0", lifespan=lifespan)


@app.exception_handler(Exception)
async def global_exception_handler(_, exc):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


app.add_middleware(RequestContextMiddleware)

app.include_router(router, prefix="/bot")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
