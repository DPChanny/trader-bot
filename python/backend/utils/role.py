from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Member, Role


async def verify_role(
    guild_id: int,
    discord_id: str,
    min_role_or_db,
    db: AsyncSession | None = None,
) -> Role:
    # Support both (guild_id, discord_id, db) and (guild_id, discord_id, Role, db)
    if db is None:
        actual_db = min_role_or_db
        min_role = Role.VIEWER
    else:
        min_role = min_role_or_db
        actual_db = db

    result = await actual_db.execute(
        select(Member).where(
            Member.guild_id == guild_id,
            Member.discord_id == discord_id,
            Member.role.isnot(None),
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    if member.role < min_role:
        raise HTTPException(status_code=403, detail="Insufficient guild permissions")
    return Role(member.role)


async def get_guild_ids(discord_id: str, db: AsyncSession) -> list[int]:
    result = await db.execute(
        select(Member.guild_id).where(
            Member.discord_id == discord_id,
            Member.role.isnot(None),
        )
    )
    return list(result.scalars().all())
