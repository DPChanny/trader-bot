from discord import User
from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from ..services import on_user_update_service
from ..utils.decorators import with_error_handler, with_session


def register_user_router(bot: commands.Bot) -> None:
    @bot.event
    @with_error_handler
    @with_session
    async def on_user_update(
        before: User,
        after: User,
        session: AsyncSession,
    ):
        if (before.global_name or before.name) == (
            after.global_name or after.name
        ) and before.avatar == after.avatar:
            return
        await on_user_update_service(after, session)
