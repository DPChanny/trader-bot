from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Member, Role


async def upsert_member(
    guild_id: int,
    discord_id: str,
    db: AsyncSession,
    name: str = "",
    guild_avatar_hash: str | None = None,
) -> Member:
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is None:
        entity = Member(
            guild_id=guild_id,
            discord_id=discord_id,
            role=Role.VIEWER,
            name=name,
            avatar_hash=guild_avatar_hash,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = name
        entity.avatar_hash = guild_avatar_hash
        await db.flush()
    return entity


async def set_role(
    guild_id: int,
    discord_id: str,
    role: Role,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.role = role
        await db.flush()


async def update_member(
    guild_id: int,
    discord_id: str,
    name: str,
    guild_avatar_hash: str | None,
    db: AsyncSession,
) -> None:
    """Sync name and guild avatar_hash from Discord. alias is intentionally
    not touched — it can only be set manually via the UI."""
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.name = name
        entity.avatar_hash = guild_avatar_hash
        await db.flush()


async def delete_member(
    guild_id: int,
    discord_id: str,
    db: AsyncSession,
) -> None:
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        await db.delete(entity)
        await db.flush()
