from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.guild_manager_dto import (
    AddGuildManagerDTO,
    GuildManagerDetailDTO,
    GuildManagerDTO,
    UpdateGuildManagerDTO,
)
from shared.entities.guild_manager import GuildManager, GuildRole
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
def get_guild_manager_list_service(
    guild_id: int, db: Session, payload: Payload
) -> list[GuildManagerDetailDTO]:
    verify_role(guild_id, payload.manager_id, GuildRole.VIEWER, db)

    guild_managers = (
        db.query(GuildManager)
        .options(joinedload(GuildManager.manager))
        .filter(GuildManager.guild_id == guild_id)
        .all()
    )
    return [GuildManagerDetailDTO.model_validate(gm) for gm in guild_managers]


@service_exception_handler
def add_guild_manager_service(
    guild_id: int, dto: AddGuildManagerDTO, db: Session, payload: Payload
) -> GuildManagerDTO:
    verify_role(guild_id, payload.manager_id, GuildRole.ADMIN, db)

    if dto.role == GuildRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot assign OWNER role")

    existing = (
        db.query(GuildManager)
        .filter(
            GuildManager.guild_id == guild_id,
            GuildManager.manager_id == dto.manager_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="Manager already in guild")

    guild_manager = GuildManager(
        guild_id=guild_id,
        manager_id=dto.manager_id,
        role=dto.role,
    )
    db.add(guild_manager)
    db.commit()
    db.refresh(guild_manager)
    logger.info(f"GuildManager added: guild_id={guild_id}, manager_id={dto.manager_id}")
    return GuildManagerDTO.model_validate(guild_manager)


@service_exception_handler
def update_guild_manager_service(
    guild_id: int,
    target_manager_id: int,
    dto: UpdateGuildManagerDTO,
    db: Session,
    payload: Payload,
) -> GuildManagerDTO:
    verify_role(guild_id, payload.manager_id, GuildRole.ADMIN, db)

    guild_manager = (
        db.query(GuildManager)
        .filter(
            GuildManager.guild_id == guild_id,
            GuildManager.manager_id == target_manager_id,
        )
        .first()
    )
    if guild_manager is None:
        raise HTTPException(status_code=404, detail="GuildManager not found")

    if guild_manager.role == GuildRole.OWNER:
        raise HTTPException(status_code=403, detail="Cannot change OWNER role")

    if dto.role == GuildRole.OWNER:
        raise HTTPException(status_code=400, detail="Cannot assign OWNER role")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(guild_manager, key, value)

    db.commit()
    db.refresh(guild_manager)
    logger.info(
        f"GuildManager updated: guild_id={guild_id}, manager_id={target_manager_id}"
    )
    return GuildManagerDTO.model_validate(guild_manager)


@service_exception_handler
def remove_guild_manager_service(
    guild_id: int, target_manager_id: int, db: Session, payload: Payload
) -> None:
    is_self = target_manager_id == payload.manager_id

    if not is_self:
        caller_role = verify_role(guild_id, payload.manager_id, GuildRole.ADMIN, db)

    guild_manager = (
        db.query(GuildManager)
        .filter(
            GuildManager.guild_id == guild_id,
            GuildManager.manager_id == target_manager_id,
        )
        .first()
    )
    if guild_manager is None:
        raise HTTPException(status_code=404, detail="GuildManager not found")

    if guild_manager.role == GuildRole.OWNER:
        raise HTTPException(status_code=403, detail="Cannot remove OWNER")

    if not is_self:
        from shared.entities.guild_manager import _ROLE_ORDER

        if _ROLE_ORDER[caller_role] <= _ROLE_ORDER[guild_manager.role]:
            raise HTTPException(
                status_code=403,
                detail="Cannot remove manager with equal or higher role",
            )

    db.delete(guild_manager)
    db.commit()
    logger.info(
        f"GuildManager removed: guild_id={guild_id}, manager_id={target_manager_id}"
    )
