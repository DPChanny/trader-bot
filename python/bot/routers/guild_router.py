from discord import Guild
from discord.ext import commands

from shared.utils.db import get_session

from ..services import (
    on_guild_join_service,
    on_guild_remove_service,
    on_guild_update_service,
)


def include_guild_router(bot: commands.Bot) -> None:
    @bot.event
    async def on_guild_join(guild: Guild):
        async for session in get_session():
            await on_guild_join_service(guild, session)

    @bot.event
    async def on_guild_update(before: Guild, after: Guild):
        async for session in get_session():
            await on_guild_update_service(before, after, session)

    @bot.event
    async def on_guild_remove(guild: Guild):
        async for session in get_session():
            await on_guild_remove_service(guild, session)
