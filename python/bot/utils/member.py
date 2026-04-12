from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Member, Role
from shared.repositories.member_repository import MemberRepository


async def upsert_member(
    guild_id: int,
    user_id: int,
    session: AsyncSession,
    name: str | None = None,
    avatar_hash: str | None = None,
) -> Member:
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
        logger.info(f"Member added: guild_id={guild_id}, user_id={user_id}")
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
        logger.info(f"Member updated: guild_id={guild_id}, user_id={user_id}")
    return entity


async def set_role(
    guild_id: int,
    user_id: int,
    role: Role,
    session: AsyncSession,
) -> None:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is not None:
        entity.role = role
        logger.info(
            f"Member role updated: guild_id={guild_id}, user_id={user_id}, role={role.name}"
        )


async def update_member(
    guild_id: int,
    user_id: int,
    name: str | None = None,
    avatar_hash: str | None = None,
    session: AsyncSession = None,
) -> None:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is not None:
        entity.name = name
        entity.avatar_hash = avatar_hash
        logger.info(f"Member updated: guild_id={guild_id}, user_id={user_id}")


async def delete_member(
    guild_id: int,
    user_id: int,
    session: AsyncSession,
) -> None:
    repo = MemberRepository(session)
    entity = await repo.get_by_user_id(user_id, guild_id)
    if entity is not None:
        await session.delete(entity)
        logger.info(f"Member deleted: guild_id={guild_id}, user_id={user_id}")
