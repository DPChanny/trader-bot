from discord import Member
from discord.ext import commands

from shared.utils.db import get_session

from ..services import (
    on_member_join_service,
    on_member_remove_service,
    on_member_update_service,
)


def include_member_router(bot: commands.Bot) -> None:
    @bot.event
    async def on_member_join(member: Member):
        if member.bot:
            return
        async for session in get_session():
            await on_member_join_service(member, session)

    @bot.event
    async def on_member_update(before: Member, after: Member):
        if after.bot:
            return
        async for session in get_session():
            await on_member_update_service(before, after, session)

    @bot.event
    async def on_member_remove(member: Member):
        if member.bot:
            return
        async for session in get_session():
            await on_member_remove_service(member, session)
