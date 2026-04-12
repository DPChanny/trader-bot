import asyncio

from discord import Intents
from discord.ext import commands

from shared.utils.env import get_discord_bot_token
from shared.utils.logging import setup_logging

from .routers import (
    include_guild_router,
    include_member_router,
    include_user_router,
)


setup_logging()


async def main() -> None:
    intents = Intents.default()
    intents.message_content = True
    intents.members = True

    bot = commands.Bot(command_prefix="!", intents=intents)

    include_guild_router(bot)
    include_member_router(bot)
    include_user_router(bot)

    await bot.start(get_discord_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
