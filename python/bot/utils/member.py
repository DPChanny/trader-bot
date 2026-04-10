from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Member, Role


async def upsert_member(
    guild_id: int,
    discord_user_id: int,
    session: AsyncSession,
    name: str | None = None,
    avatar_hash: str | None = None,
) -> Member:
    result = await session.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_user_id == discord_user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Member(
            guild_id=guild_id,
            discord_user_id=discord_user_id,
            role=Role.VIEWER,
            name=name,
            avatar_hash=avatar_hash,
        )
        session.add(entity)
        await session.flush()
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
        await session.flush()
    return entity


async def set_role(
    guild_id: int,
    discord_user_id: int,
    role: Role,
    session: AsyncSession,
) -> None:
    result = await session.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_user_id == discord_user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.role = role
        await session.flush()


async def update_member(
    guild_id: int,
    discord_user_id: int,
    name: str | None = None,
    avatar_hash: str | None = None,
    session: AsyncSession = None,
) -> None:
    result = await session.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_user_id == discord_user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.name = name
        entity.avatar_hash = avatar_hash
        await session.flush()


async def delete_member(
    guild_id: int,
    discord_user_id: int,
    session: AsyncSession,
) -> None:
    result = await session.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_user_id == discord_user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        await session.delete(entity)
        await session.flush()
