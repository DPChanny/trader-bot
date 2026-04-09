from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Member, Role


def get_avatar_url(guild_id: str, user_id: str, avatar_hash: str) -> str:
    ext = "gif" if avatar_hash.startswith("a_") else "png"
    return f"https://cdn.discordapp.com/guilds/{guild_id}/users/{user_id}/avatars/{avatar_hash}.{ext}?size=256"


async def upsert_member(
    guild_id: int,
    discord_id: str,
    db: AsyncSession,
    guild_discord_id: str | None = None,
    name: str | None = None,
    avatar_hash: str | None = None,
) -> Member:
    avatar_url = (
        get_avatar_url(guild_discord_id, discord_id, avatar_hash)
        if (guild_discord_id and avatar_hash)
        else None
    )
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
            avatar_url=avatar_url,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = name
        entity.avatar_url = avatar_url
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
    guild_discord_id: str | None = None,
    name: str | None = None,
    avatar_hash: str | None = None,
    db: AsyncSession = None,
) -> None:
    avatar_url = (
        get_avatar_url(guild_discord_id, discord_id, avatar_hash)
        if (guild_discord_id and avatar_hash)
        else None
    )
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.name = name
        entity.avatar_url = avatar_url
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
