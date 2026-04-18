from sqlalchemy.ext.asyncio import AsyncSession

from ..dtos.member import MemberDTO, Role
from ..entities.member import Member
from ..repositories.member_repository import MemberRepository


async def upsert_member(
    guild_id: int,
    user_id: int,
    session: AsyncSession,
    name: str | None = None,
    avatar_hash: str | None = None,
    role: Role | None = None,
) -> MemberDTO:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is None:
        entity = Member(
            guild_id=guild_id,
            user_id=user_id,
            role=role if role is not None else Role.VIEWER,
            name=name,
            avatar_hash=avatar_hash,
        )
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
        if role is not None:
            entity.role = role

    return MemberDTO.model_validate(entity)
