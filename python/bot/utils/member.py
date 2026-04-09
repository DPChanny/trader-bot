from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.discord import Discord
from shared.entities.member import Member, Role


async def _upsert_discord(
    discord_id: str,
    name: str,
    avatar_hash: str | None,
    db: AsyncSession,
) -> None:
    result = await db.execute(select(Discord).where(Discord.discord_id == discord_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        db.add(Discord(discord_id=discord_id, name=name, avatar_hash=avatar_hash))
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
    await db.flush()


async def upsert_member(
    guild_id: int,
    discord_id: str,
    db: AsyncSession,
    discord_name: str = "",
    discord_avatar_hash: str | None = None,
    guild_nick: str | None = None,
    guild_avatar_hash: str | None = None,
) -> Member:
    await _upsert_discord(discord_id, discord_name, discord_avatar_hash, db)
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
            name=guild_nick,
            avatar_hash=guild_avatar_hash,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = guild_nick
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
    discord_name: str,
    discord_avatar_hash: str | None,
    guild_nick: str | None,
    guild_avatar_hash: str | None,
    db: AsyncSession,
) -> None:
    """Sync Discord global profile and guild nick/avatar from Discord.
    alias is intentionally not touched — it can only be set manually via the UI."""
    await _upsert_discord(discord_id, discord_name, discord_avatar_hash, db)
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.name = guild_nick
        entity.avatar_hash = guild_avatar_hash
        await db.flush()


async def update_discord_global(
    discord_id: str,
    name: str,
    avatar_hash: str | None,
    db: AsyncSession,
) -> None:
    """Sync only the Discord global profile (name, avatar). Used by on_user_update."""
    await _upsert_discord(discord_id, name, avatar_hash, db)


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
