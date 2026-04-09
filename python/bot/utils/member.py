from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Member, Role


async def upsert_member(
    guild_id: int,
    discord_user_id: int,
    db: AsyncSession,
    name: str | None = None,
    avatar_hash: str | None = None,
) -> Member:
    result = await db.execute(
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
        db.add(entity)
        await db.flush()
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
        await db.flush()
    return entity


async def set_role(
    guild_id: int,
    discord_user_id: int,
    role: Role,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_user_id == discord_user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.role = role
        await db.flush()


async def update_member(
    guild_id: int,
    discord_user_id: int,
    name: str | None = None,
    avatar_hash: str | None = None,
    db: AsyncSession = None,
) -> None:
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_user_id == discord_user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.name = name
        entity.avatar_hash = avatar_hash
        await db.flush()


async def delete_member(
    guild_id: int,
    discord_user_id: int,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_user_id == discord_user_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        await db.delete(entity)
        await db.flush()
