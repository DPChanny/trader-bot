from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.manager_dto import (
    AddManagerDTO,
    ManagerDetailDTO,
    ManagerDTO,
    UpdateManagerDTO,
)
from shared.entities.manager import _ROLE_ORDER, Manager, Role
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
def get_manager_list_service(
    guild_id: int, db: Session, payload: Payload
) -> list[ManagerDetailDTO]:
    verify_role(guild_id, payload.user_id, Role.VIEWER, db)

    managers = (
        db.query(Manager)
        .options(joinedload(Manager.user))
        .filter(Manager.guild_id == guild_id)
        .all()
    )
    return [ManagerDetailDTO.model_validate(m) for m in managers]


@service_exception_handler
def add_manager_service(
    guild_id: int, dto: AddManagerDTO, db: Session, payload: Payload
) -> ManagerDTO:
    verify_role(guild_id, payload.user_id, Role.ADMIN, db)

    existing = (
        db.query(Manager)
        .filter(
            Manager.guild_id == guild_id,
            Manager.user_id == dto.user_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="User already in guild")

    manager = Manager(
        guild_id=guild_id,
        user_id=dto.user_id,
        role=dto.role,
    )
    db.add(manager)
    db.commit()
    db.refresh(manager)
    logger.info(f"Manager added: guild_id={guild_id}, user_id={dto.user_id}")
    return ManagerDTO.model_validate(manager)


@service_exception_handler
def update_manager_service(
    guild_id: int,
    target_user_id: int,
    dto: UpdateManagerDTO,
    db: Session,
    payload: Payload,
) -> ManagerDTO:
    verify_role(guild_id, payload.user_id, Role.ADMIN, db)

    manager = (
        db.query(Manager)
        .filter(
            Manager.guild_id == guild_id,
            Manager.user_id == target_user_id,
        )
        .first()
    )
    if manager is None:
        raise HTTPException(status_code=404, detail="Manager not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(manager, key, value)

    db.commit()
    db.refresh(manager)
    logger.info(f"Manager updated: guild_id={guild_id}, user_id={target_user_id}")
    return ManagerDTO.model_validate(manager)


@service_exception_handler
def remove_manager_service(
    guild_id: int, target_user_id: int, db: Session, payload: Payload
) -> None:
    is_self = target_user_id == payload.user_id

    if not is_self:
        caller_role = verify_role(guild_id, payload.user_id, Role.ADMIN, db)

    manager = (
        db.query(Manager)
        .filter(
            Manager.guild_id == guild_id,
            Manager.user_id == target_user_id,
        )
        .first()
    )
    if manager is None:
        raise HTTPException(status_code=404, detail="Manager not found")

    if not is_self and _ROLE_ORDER[caller_role] <= _ROLE_ORDER[manager.role]:
        raise HTTPException(
            status_code=403,
            detail="Cannot remove user with equal or higher role",
        )

    db.delete(manager)
    db.commit()
    logger.info(f"Manager removed: guild_id={guild_id}, user_id={target_user_id}")
