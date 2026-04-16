from discord import Member
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import bot_service

from ..utils.member import delete_member, sync_member_admin_role, sync_member


@bot_service
async def on_member_join_service(
    member: Member,
    session: AsyncSession,
    event,
) -> None:
    member_dto = await sync_member(member, session)
    event |= member_dto.model_dump()


@bot_service
async def on_member_update_service(
    before: Member,
    after: Member,
    session: AsyncSession,
    event,
) -> None:
    event |= (await sync_member(after, session)).model_dump()
    if before.guild_permissions.administrator != after.guild_permissions.administrator:
        role_dto = await sync_member_admin_role(
            after.guild.id, after.id, after.guild_permissions.administrator, session
        )
        if role_dto:
            event |= role_dto.model_dump()


@bot_service
async def on_member_remove_service(
    member: Member,
    session: AsyncSession,
    event,
) -> None:
    member_dto = await delete_member(member.guild.id, member.id, session)
    event |= member_dto.model_dump()
