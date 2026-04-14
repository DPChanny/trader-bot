import asyncio

from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.router import bot_router

from ..services import on_ready_service


def include_on_ready_router(bot: commands.Bot) -> None:
    on_ready_lock = asyncio.Lock()

    @bot.event
    @bot_router
    async def on_ready(session: AsyncSession):
        async with on_ready_lock:
            await on_ready_service(bot, session)
