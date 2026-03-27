import asyncio

from discord.ext import commands
from loguru import logger

from shared.utils.env import get_bot_token
from shared.utils.logging import setup_logging

from .utils import setup_intents


setup_logging()


async def main() -> None:
    intents = setup_intents()
    bot = commands.Bot(command_prefix="!", intents=intents)

    @bot.event
    async def on_ready():
        logger.info(f"Ready: {bot.user}")
        await bot.tree.sync()

    await bot.start(get_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
