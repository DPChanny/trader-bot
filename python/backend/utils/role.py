from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.member import Member, Role


async def verify_role(
    guild_id: int,
    discord_id: str,
    db: AsyncSession,
    min_role: Role = Role.VIEWER,
) -> Role:
    result = await db.execute(
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
