from fastapi import HTTPException
from sqlalchemy.orm import Session

from shared.entities.guild_manager import GuildManager, GuildRole, guild_role_gte


def get_accessible_guild_ids(manager_id: int, db: Session) -> list[int]:
    guild_managers = (
        db.query(GuildManager).filter(GuildManager.manager_id == manager_id).all()
    )
    return [gm.guild_id for gm in guild_managers]


def get_manager_role(guild_id: int, manager_id: int, db: Session) -> GuildRole | None:
    gm = (
        db.query(GuildManager)
        .filter(
            GuildManager.guild_id == guild_id,
            GuildManager.manager_id == manager_id,
        )
        .first()
    )
    return gm.role if gm else None


def require_guild_role(
    guild_id: int, manager_id: int, min_role: GuildRole, db: Session
) -> GuildRole:
    role = get_manager_role(guild_id, manager_id, db)
    if role is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    if not guild_role_gte(role, min_role):
        raise HTTPException(status_code=403, detail="Insufficient guild permissions")
    return role
