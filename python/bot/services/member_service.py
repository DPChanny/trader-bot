from discord import Member
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.utils.service import bot_service

from ..utils.member import delete_member, update_member_role, upsert_member
from .user_service import sync_user_service


async def sync_member_service(member: Member, session: AsyncSession) -> dict:
    await sync_user_service(member, session)
    member_dto = await upsert_member(member, session)
    return member_dto.model_dump()


@bot_service
async def on_member_join_service(
    member: Member,
    session: AsyncSession,
    event,
) -> None:
    event |= await sync_member_service(member, session)


@bot_service
async def on_member_update_service(
    before: Member,
    after: Member,
    session: AsyncSession,
    event,
) -> None:
    result = await sync_member_service(after, session)
    if before.guild_permissions.administrator != after.guild_permissions.administrator:
        role = Role.ADMIN if after.guild_permissions.administrator else Role.VIEWER
        role_dto = await update_member_role(after.guild.id, after.id, role, session)
        result |= role_dto.model_dump()
    event |= result


@bot_service
async def on_member_remove_service(
    member: Member,
    session: AsyncSession,
    event,
) -> None:
    member_dto = await delete_member(member.guild.id, member.id, session)
    event |= member_dto.model_dump()
