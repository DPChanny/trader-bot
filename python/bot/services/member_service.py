from discord import Member
from sqlalchemy.ext.asyncio import AsyncSession

from shared.decorator import service
from shared.utils.user import upsert_user

from ..utils.guild import upsert_guild
from ..utils.member import delete_member, upsert_member


@service
async def on_member_join_service(
    member: Member,
    session: AsyncSession,
    logger,
) -> None:
    guild_entity = await upsert_guild(
        member.guild.id,
        member.guild.name,
        member.guild.icon.key if member.guild.icon else None,
        session,
    )
    user = await upsert_user(
        member.id,
        member.global_name or member.name,
        member.avatar.key if member.avatar else None,
        session,
    )
    member_dto = await upsert_member(
        guild_entity.discord_id,
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
    guild_entity = await upsert_guild(
        member.guild.id,
        member.guild.name,
        member.guild.icon.key if member.guild.icon else None,
        session,
    )
    user = await upsert_user(
        member.id,
        member.global_name or member.name,
        member.avatar.key if member.avatar else None,
        session,
    )
    member_dto = await upsert_member(
        guild_entity.discord_id,
        member.id,
        session,
        name=member.nick,
        avatar_hash=member.guild_avatar.key if member.guild_avatar else None,
    )
    logger.bind(**user.model_dump())
    logger.bind(**member_dto.model_dump())


@service
async def on_member_remove_service(
    member: Member,
    session: AsyncSession,
    logger,
) -> None:
    guild_entity = await upsert_guild(
        member.guild.id,
        member.guild.name,
        member.guild.icon.key if member.guild.icon else None,
        session,
    )
    await delete_member(guild_entity.discord_id, member.id, session)
    logger.bind(
        guild_id=guild_entity.discord_id,
        user_id=member.id,
        name=member.name,
    )
