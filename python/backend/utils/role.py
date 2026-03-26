from fastapi import HTTPException
from sqlalchemy.orm import Session

from shared.entities.manager import Manager, Role


_ROLE_ORDER = {
    Role.VIEWER: 0,
    Role.EDITOR: 1,
    Role.ADMIN: 2,
}


def get_guild_ids(user_id: int, db: Session) -> list[int]:
    managers = db.query(Manager).filter(Manager.user_id == user_id).all()
    return [m.guild_id for m in managers]


def verify_role(guild_id: int, user_id: int, min_role: Role, db: Session) -> Role:
    manager = (
        db.query(Manager)
        .filter(
            Manager.guild_id == guild_id,
            Manager.user_id == user_id,
        )
        .first()
    )
    if manager is None:
        raise HTTPException(status_code=404, detail="Guild not found")
    if not _ROLE_ORDER[manager.role] >= _ROLE_ORDER[min_role]:
        raise HTTPException(status_code=403, detail="Insufficient guild permissions")
    return manager.role
