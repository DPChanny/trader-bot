import asyncio

from discord import Guild, Intents, Member, User
from discord.ext import commands
from loguru import logger

from shared.error import AppError
from shared.utils.database import get_session
from shared.utils.env import get_discord_bot_token
from shared.utils.logging import setup_logging

from .services import (
    on_guild_join_service,
    on_guild_remove_service,
    on_guild_update_service,
    on_member_join_service,
    on_member_remove_service,
    on_member_update_service,
    on_user_update_service,
)


setup_logging()


async def main() -> None:
    intents = Intents.default()
    intents.message_content = True
    intents.members = True

    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_ready():
        logger.bind(bot_user=str(bot.user)).info("")
        try:
            async for session in get_session():
                for guild in bot.guilds:
                    await on_guild_join_service(guild, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(event="on_ready", exception_type=type(e).__name__).exception("")

    @bot.event
    async def on_guild_join(guild: Guild):
        try:
            async for session in get_session():
                await on_guild_join_service(guild, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(
                event="on_guild_join", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_member_join(member: Member):
        if member.bot:
            return
        try:
            async for session in get_session():
                await on_member_join_service(member, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(
                event="on_member_join", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_member_update(before: Member, after: Member):
        if after.bot:
            return
        if before.nick == after.nick and before.guild_avatar == after.guild_avatar:
            return
        try:
            async for session in get_session():
                await on_member_update_service(after, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(
                event="on_member_update", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_user_update(before: User, after: User):
        if (before.global_name or before.name) == (
            after.global_name or after.name
        ) and before.avatar == after.avatar:
            return
        try:
            async for session in get_session():
                await on_user_update_service(after, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(
                event="on_user_update", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_guild_update(before: Guild, after: Guild):
        if before.owner_id == after.owner_id:
            return
        try:
            async for session in get_session():
                await on_guild_update_service(before, after, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(
                event="on_guild_update", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_guild_remove(guild: Guild):
        try:
            async for session in get_session():
                await on_guild_remove_service(guild, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(
                event="on_guild_remove", exception_type=type(e).__name__
            ).exception("")

    @bot.event
    async def on_member_remove(member: Member):
        if member.bot:
            return
        try:
            async for session in get_session():
                await on_member_remove_service(member, session)
        except AppError:
            return
        except Exception as e:
            logger.bind(
                event="on_member_remove", exception_type=type(e).__name__
            ).exception("")

    await bot.start(get_discord_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
