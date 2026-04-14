from discord import Guild
from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.router import bot_router

from ..services import (
    on_guild_join_service,
    on_guild_remove_service,
    on_guild_update_service,
)


def include_guild_router(bot: commands.Bot) -> None:
    @bot.event
    @bot_router
    async def on_guild_join(guild: Guild, session: AsyncSession):
        await on_guild_join_service(guild, session)

    @bot.event
    @bot_router
    async def on_guild_update(before: Guild, after: Guild, session: AsyncSession):
        if before.owner_id == after.owner_id:
            return
        await on_guild_update_service(before, after, session)

    @bot.event
    @bot_router
    async def on_guild_remove(guild: Guild, session: AsyncSession):
        await on_guild_remove_service(guild, session)
