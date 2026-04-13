from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member_dto import MemberDTO
from shared.entities.member import Member, Role
from shared.repositories.member_repository import MemberRepository
from shared.utils.error import HTTPError, MemberErrorCode


async def upsert_member(
    guild_id: int,
    user_id: int,
    session: AsyncSession,
    name: str | None = None,
    avatar_hash: str | None = None,
) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        entity = Member(
            guild_id=guild_id,
            user_id=user_id,
            role=Role.VIEWER,
            name=name,
            avatar_hash=avatar_hash,
        )
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash

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
        raise HTTPError(MemberErrorCode.NotFound)

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
        raise HTTPError(MemberErrorCode.NotFound)
    dto = MemberDTO.model_validate(entity)
    await session.delete(entity)
    return dto
