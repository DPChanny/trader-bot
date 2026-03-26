from fastapi import HTTPException
from sqlalchemy.orm import Session

from shared.entities.guild_manager import GuildManager, GuildRole, guild_role_gte


def get_guild_ids(manager_id: int, db: Session) -> list[int]:
    guild_managers = (
        db.query(GuildManager).filter(GuildManager.manager_id == manager_id).all()
    )
    return [gm.guild_id for gm in guild_managers]


def verify_role(
    guild_id: int, manager_id: int, min_role: GuildRole, db: Session
) -> GuildRole:
    gm = (
        db.query(GuildManager)
        .filter(
            GuildManager.guild_id == guild_id,
            GuildManager.manager_id == manager_id,
        )
        .first()
    )
    if gm is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    if not guild_role_gte(gm.role, min_role):
        raise HTTPException(status_code=403, detail="Insufficient guild permissions")
    return gm.role
