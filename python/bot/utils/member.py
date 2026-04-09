from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.discord import Discord
from shared.entities.member import Member, Role


def _discord_avatar_url(discord_id: str, avatar_hash: str | None) -> str | None:
    if not avatar_hash:
        return None
    ext = "gif" if avatar_hash.startswith("a_") else "png"
    return (
        f"https://cdn.discordapp.com/avatars/{discord_id}/{avatar_hash}.{ext}?size=256"
    )


def _member_avatar_url(
    guild_discord_id: str, discord_id: str, avatar_hash: str | None
) -> str | None:
    if not avatar_hash:
        return None
    ext = "gif" if avatar_hash.startswith("a_") else "png"
    return f"https://cdn.discordapp.com/guilds/{guild_discord_id}/users/{discord_id}/avatars/{avatar_hash}.{ext}?size=256"


async def _upsert_discord(
    discord_id: str,
    name: str,
    avatar_url: str | None,
    db: AsyncSession,
) -> None:
    result = await db.execute(select(Discord).where(Discord.discord_id == discord_id))
    entity = result.scalar_one_or_none()
    if entity is None:
        db.add(Discord(discord_id=discord_id, name=name, avatar_url=avatar_url))
    else:
        entity.name = name
        entity.avatar_url = avatar_url
    await db.flush()


async def upsert_member(
    guild_id: int,
    discord_id: str,
    db: AsyncSession,
    discord_name: str = "",
    discord_avatar_url: str | None = None,
    guild_nick: str | None = None,
    guild_avatar_url: str | None = None,
) -> Member:
    await _upsert_discord(discord_id, discord_name, discord_avatar_url, db)
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
            avatar_url=guild_avatar_url,
        )
        db.add(entity)
        await db.flush()
    else:
        entity.name = guild_nick
        entity.avatar_url = guild_avatar_url
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
    discord_avatar_url: str | None,
    guild_nick: str | None,
    guild_avatar_url: str | None,
    db: AsyncSession,
) -> None:
    """Sync Discord global profile and guild nick/avatar from Discord.
    alias is intentionally not touched — it can only be set manually via the UI."""
    await _upsert_discord(discord_id, discord_name, discord_avatar_url, db)
    result = await db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
        )
    )
    entity = result.scalar_one_or_none()
    if entity is not None:
        entity.name = guild_nick
        entity.avatar_url = guild_avatar_url
        await db.flush()


async def update_discord_global(
    discord_id: str,
    name: str,
    avatar_url: str | None,
    db: AsyncSession,
) -> None:
    """Sync only the Discord global profile (name, avatar). Used by on_user_update."""
    await _upsert_discord(discord_id, name, avatar_url, db)


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
