from discord import Member
from discord.ext import commands
from sqlalchemy.ext.asyncio import AsyncSession

from ..services import (
    on_member_join_service,
    on_member_remove_service,
    on_member_update_service,
)
from ..utils.router import router


def include_member_router(bot: commands.Bot) -> None:
    @bot.event
    @router
    async def on_member_join(member: Member, session: AsyncSession):
        if member.bot:
            return
        await on_member_join_service(member, session)

    @bot.event
    @router
    async def on_member_update(before: Member, after: Member, session: AsyncSession):
        if after.bot:
            return
        if before.nick == after.nick and before.guild_avatar == after.guild_avatar:
            return
        await on_member_update_service(after, session)

    @bot.event
    @router
    async def on_member_remove(member: Member, session: AsyncSession):
        if member.bot:
            return
        await on_member_remove_service(member, session)
