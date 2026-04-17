from discord import Member
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import bot_service

from ..utils.member import delete_member, sync_member, sync_member_admin_role


@bot_service
async def on_member_join_service(
    member: Member,
    session: AsyncSession,
) -> None:
    await sync_member(member, session)


@bot_service
async def on_member_update_service(
    before: Member,
    after: Member,
    session: AsyncSession,
) -> None:
    await sync_member(after, session)
    if before.guild_permissions.administrator != after.guild_permissions.administrator:
        await sync_member_admin_role(
            after.guild.id, after.id, after.guild_permissions.administrator, session
        )


@bot_service
async def on_member_remove_service(
    member: Member,
    session: AsyncSession,
) -> None:
    await delete_member(member.guild.id, member.id, session)
