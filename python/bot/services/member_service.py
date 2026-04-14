from discord import Member
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import bot_service
from shared.utils.user import upsert_user

from ..utils.member import delete_member, upsert_member


async def sync_member_service(member: Member, session: AsyncSession) -> dict:
    await upsert_user(
        member.id,
        member.global_name or member.name,
        member.avatar.key if member.avatar else None,
        session,
    )
    member_dto = await upsert_member(
        member.guild.id,
        member.id,
        session,
        name=member.nick,
        avatar_hash=member.guild_avatar.key if member.guild_avatar else None,
    )
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
    member: Member,
    session: AsyncSession,
    event,
) -> None:
    event |= await sync_member_service(member, session)


@bot_service
async def on_member_remove_service(
    member: Member,
    session: AsyncSession,
    event,
) -> None:
    member_dto = await delete_member(member.guild.id, member.id, session)
    event |= member_dto.model_dump()
