from discord import Member as DiscordMember
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import MemberDTO, Role
from shared.entities.member import Member
from shared.repositories.member_repository import MemberRepository
from shared.utils.error import AppError, MemberErrorCode


async def upsert_member(
    member: DiscordMember,
    session: AsyncSession,
) -> MemberDTO:
    guild_id = member.guild.id
    user_id = member.id
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        entity = Member(
            guild_id=guild_id,
            user_id=user_id,
            role=Role.VIEWER,
            name=member.nick,
            avatar_hash=member.guild_avatar.key if member.guild_avatar else None,
        )
        session.add(entity)
        await session.flush()
    else:
        entity.name = member.nick
        entity.avatar_hash = member.guild_avatar.key if member.guild_avatar else None

    return MemberDTO.model_validate(entity)


async def update_member_role(
    guild_id: int,
    user_id: int,
    role: Role,
    session: AsyncSession,
) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        raise AppError(MemberErrorCode.NotFound)

    entity.role = role

    return MemberDTO.model_validate(entity)


async def delete_member(
    guild_id: int,
    user_id: int,
    session: AsyncSession,
) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        raise AppError(MemberErrorCode.NotFound)
    dto = MemberDTO.model_validate(entity)
    await session.delete(entity)
    return dto
