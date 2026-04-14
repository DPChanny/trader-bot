from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.router import bot_router

from ..services import on_ready_service


def include_on_ready_router(bot: commands.Bot) -> None:
    @bot.event
    @bot_router
    async def on_ready(session: AsyncSession):
        await on_ready_service(bot, session)
