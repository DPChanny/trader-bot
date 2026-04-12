from discord import Guild
from discord.ext import commands
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from ..services import (
    on_guild_join_service,
    on_guild_remove_service,
    on_guild_update_service,
)
from ..utils.decorators import with_error_handler, with_session


def register_guild_router(bot: commands.Bot) -> None:
    @bot.event
    @with_error_handler
    @with_session
    async def on_ready(session: AsyncSession):
        logger.bind(bot_user=str(bot.user)).info("")
        for guild in bot.guilds:
            await on_guild_join_service(guild, session)

    @bot.event
    @with_error_handler
    @with_session
    async def on_guild_join(guild: Guild, session: AsyncSession):
        await on_guild_join_service(guild, session)

    @bot.event
    @with_error_handler
    @with_session
    async def on_guild_update(
        before: Guild,
        after: Guild,
        session: AsyncSession,
    ):
        if before.owner_id == after.owner_id:
            return
        await on_guild_update_service(before, after, session)

    @bot.event
    @with_error_handler
    @with_session
    async def on_guild_remove(guild: Guild, session: AsyncSession):
        await on_guild_remove_service(guild, session)
