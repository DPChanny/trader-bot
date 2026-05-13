from discord import Member as DiscordMember
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import MemberDTO, Role
from shared.repositories.member_repository import MemberRepository
from shared.utils.error import AppError, NotFoundErrorCode

from .user import sync_user


async def upsert_member(member: DiscordMember, session: AsyncSession) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.upsert(
        guild_id=member.guild.id,
        user_id=member.id,
        name=member.nick,
        avatar_hash=member.guild_avatar.key if member.guild_avatar else None,
        role=Role.VIEWER,
    )
    return MemberDTO.model_validate(entity)


async def update_member_role(
    guild_id: int, user_id: int, role: Role, session: AsyncSession
) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        raise AppError(NotFoundErrorCode.Member)

    entity.role = role

    return MemberDTO.model_validate(entity)


async def sync_member_admin_role(
    guild_id: int, user_id: int, is_admin: bool, session: AsyncSession
) -> MemberDTO | None:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        raise AppError(NotFoundErrorCode.Member)

    if is_admin and entity.role < Role.ADMIN:
        entity.role = Role.ADMIN
        return MemberDTO.model_validate(entity)

    if not is_admin and entity.role == Role.ADMIN:
        entity.role = Role.VIEWER
        return MemberDTO.model_validate(entity)

    return None


async def sync_member(member: DiscordMember, session: AsyncSession) -> MemberDTO:
    await sync_user(member, session)
    return await upsert_member(member, session)


async def delete_member(
    guild_id: int, user_id: int, session: AsyncSession
) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        raise AppError(NotFoundErrorCode.Member)
    dto = MemberDTO.model_validate(entity)
    await session.delete(entity)
    return dto
