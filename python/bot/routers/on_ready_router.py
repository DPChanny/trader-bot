import asyncio

from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.router import bot_router

from ..services import on_ready_service


def include_on_ready_router(bot: commands.Bot) -> None:
    on_ready_lock = asyncio.Lock()
    on_ready_completed = False

    @bot.event
    @bot_router
    async def on_ready(session: AsyncSession):
        nonlocal on_ready_completed

        if on_ready_completed:
            return

        async with on_ready_lock:
            if on_ready_completed:
                return

            await on_ready_service(bot, session)
            on_ready_completed = True
