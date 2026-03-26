from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities.manager import Manager, Role


_ROLE_ORDER = {
    Role.VIEWER: 0,
    Role.EDITOR: 1,
    Role.ADMIN: 2,
}


async def get_guild_ids(user_id: int, db: AsyncSession) -> list[int]:
    result = await db.execute(
        select(Manager.guild_id).where(Manager.user_id == user_id)
    )
    return list(result.scalars().all())


async def verify_role(
    guild_id: int, user_id: int, min_role: Role, db: AsyncSession
) -> Role:
    result = await db.execute(
        select(Manager).where(
            Manager.guild_id == guild_id,
            Manager.user_id == user_id,
        )
    )
    manager = result.scalar_one_or_none()
    if manager is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    if not _ROLE_ORDER[manager.role] >= _ROLE_ORDER[min_role]:
        raise HTTPException(status_code=403, detail="Insufficient guild permissions")
    return manager.role
