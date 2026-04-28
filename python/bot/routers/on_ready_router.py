import asyncio

from discord.ext import commands

from shared.utils.db import get_session

from ..services import on_ready_service


def include_on_ready_router(bot: commands.Bot) -> None:
    on_ready_lock = asyncio.Lock()

    @bot.event
    async def on_ready():
        async with on_ready_lock:
            async for session in get_session():
                await on_ready_service(bot, session)
