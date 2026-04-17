import asyncio
from pathlib import Path

from discord import Intents
from discord.ext import commands

from shared.utils.env import get_discord_bot_token
from shared.utils.logging import setup_logging

from .routers import (
    include_guild_router,
    include_member_router,
    include_on_ready_router,
    include_user_router,
)


setup_logging(
    log_dir=Path(__file__).resolve().parent / "logs", log_name="{time:YYMMDDHHMMSS}.log"
)


async def main() -> None:
    intents = Intents.default()
    intents.message_content = True
    intents.members = True

    bot = commands.Bot(command_prefix="!", intents=intents)

    include_on_ready_router(bot)
    include_guild_router(bot)
    include_member_router(bot)
    include_user_router(bot)

    await bot.start(get_discord_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
