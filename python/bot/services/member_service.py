from discord import Member
from sqlalchemy.ext.asyncio import AsyncSession

from shared.utils.service import service
from shared.utils.user import upsert_user

from ..utils.member import delete_member, upsert_member


@service
async def on_member_join_service(
    member: Member,
    session: AsyncSession,
    logger,
) -> None:
    user = await upsert_user(
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
    logger.bind(**user.model_dump())
    logger.bind(**member_dto.model_dump())


@service
async def on_member_update_service(
    member: Member,
    session: AsyncSession,
    logger,
) -> None:
    member_dto = await upsert_member(
        member.guild.id,
        member.id,
        session,
        name=member.nick,
        avatar_hash=member.guild_avatar.key if member.guild_avatar else None,
    )
    logger.bind(**member_dto.model_dump())


@service
async def on_member_remove_service(
    member: Member,
    session: AsyncSession,
    logger,
) -> None:
    await delete_member(member.guild.id, member.id, session)
    logger.bind(
        guild_id=member.guild.id,
        user_id=member.id,
    )
