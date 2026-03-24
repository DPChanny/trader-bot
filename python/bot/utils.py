import asyncio
import contextlib

import discord
from discord.ext import commands
from fastapi import HTTPException
from loguru import logger

from shared.env import get_discord_bot_token


_bot: discord.Client | None = None
_task: asyncio.Task | None = None


def get_bot() -> discord.Client:
    if not _bot or not _bot.is_ready():
        raise HTTPException(status_code=503, detail="Bot not ready")
    return _bot


async def start_bot() -> None:
    global _bot, _task

    token = get_discord_bot_token()

    intents = discord.Intents.default()
    intents.message_content = True
    intents.members = True
    bot = commands.Bot(command_prefix="!", intents=intents)
    _bot = bot

    @bot.event
    async def on_ready():
        logger.info(f"Ready: {bot.user}")

    @bot.event
    async def on_disconnect():
        logger.warning("Disconnected")

    @bot.event
    async def on_error(event, *args, **kwargs):
        logger.exception(f"Discord bot error: event={event}")

    _task = asyncio.create_task(bot.start(token, reconnect=True))

    try:
        await asyncio.wait_for(bot.wait_until_ready(), timeout=60.0)
    except TimeoutError:
        logger.warning("Startup timeout")


async def stop_bot() -> None:
    global _bot, _task

    if _bot:
        try:
            await _bot.close()
        except Exception as e:
            logger.exception(f"Discord bot stop error: {e}")

    if _task:
        _task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await _task

    _bot = None
    _task = None
    logger.info("Stopped")
