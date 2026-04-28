from discord import User
from discord.ext import commands

from shared.utils.db import get_session

from ..services import on_user_update_service


def include_user_router(bot: commands.Bot) -> None:
    @bot.event
    async def on_user_update(before: User, after: User):
        if (before.global_name or before.name) == (
            after.global_name or after.name
        ) and before.avatar == after.avatar:
            return
        async for session in get_session():
            await on_user_update_service(after, session)
