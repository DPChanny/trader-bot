import asyncio
import sys
from pathlib import Path

from discord import Client, Intents

from shared.utils.env import get_discord_bot_token
from shared.utils.error import AppError, UnexpectedErrorCode, handle_app_error
from shared.utils.logging import setup_logging

from .routers import (
    include_guild_router,
    include_member_router,
    include_on_ready_router,
    include_user_router,
)


setup_logging(log_dir=Path(__file__).resolve().parent / "logs")


async def main() -> None:
    intents = Intents().none()
    intents.members = True
    intents.guilds = True

    bot = Client(intents=intents)

    include_on_ready_router(bot)
    include_guild_router(bot)
    include_member_router(bot)
    include_user_router(bot)

    @bot.event
    async def on_error(_event_method: str, *_args, **_kwargs) -> None:
        _, error, _ = sys.exc_info()
        if isinstance(error, AppError):
            handle_app_error(error)
            return

        app_error = AppError(UnexpectedErrorCode.Internal)
        if isinstance(error, BaseException):
            app_error.__cause__ = error
            app_error.__traceback__ = error.__traceback__
        handle_app_error(app_error)

    await bot.start(get_discord_bot_token(), reconnect=True)


if __name__ == "__main__":
    asyncio.run(main())
