import asyncio

from discord.ext import commands

from shared.utils.db import get_session

from ..services import on_ready_service


def include_on_ready_router(bot: commands.Bot) -> None:
    on_ready_lock = asyncio.Lock()
    tree_synced = False

    @bot.event
    async def on_ready():
        nonlocal tree_synced
        async with on_ready_lock:
            async for session in get_session():
                await on_ready_service(bot, session)
            if not tree_synced:
                await bot.tree.sync()
                tree_synced = True
