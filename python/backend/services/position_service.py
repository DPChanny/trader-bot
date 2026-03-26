from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.position_dto import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.entities.manager import Role
from shared.entities.position import Position
from shared.entities.preset import Preset
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
def get_position_list_service(
    guild_id: int, db: Session, payload: Payload
) -> list[PositionDTO]:
    verify_role(guild_id, payload.user_id, Role.VIEWER, db)
    positions = (
        db.query(Position).join(Preset).filter(Preset.guild_id == guild_id).all()
    )
    return [PositionDTO.model_validate(p) for p in positions]


@service_exception_handler
def get_position_detail_service(
    guild_id: int, position_id: int, db: Session, payload: Payload
) -> PositionDTO:
    verify_role(guild_id, payload.user_id, Role.VIEWER, db)
    position = (
        db.query(Position)
        .join(Preset)
        .filter(Position.position_id == position_id, Preset.guild_id == guild_id)
        .first()
    )

    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found")

    return PositionDTO.model_validate(position)


@service_exception_handler
def add_position_service(
    guild_id: int, dto: AddPositionDTO, db: Session, payload: Payload
) -> PositionDTO:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    preset = (
        db.query(Preset)
        .filter(Preset.preset_id == dto.preset_id, Preset.guild_id == guild_id)
        .first()
    )
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    position = Position(
        preset_id=dto.preset_id,
        name=dto.name,
        icon_url=dto.icon_url,
    )
    db.add(position)
    db.commit()
    db.refresh(position)
    logger.info(f"Position created: id={position.position_id}, name={dto.name}")
    return PositionDTO.model_validate(position)


@service_exception_handler
def update_position_service(
    guild_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    db: Session,
    payload: Payload,
) -> PositionDTO:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    position = (
        db.query(Position)
        .join(Preset)
        .filter(Position.position_id == position_id, Preset.guild_id == guild_id)
        .first()
    )
    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(position, key, value)

    db.commit()
    db.refresh(position)
    logger.info(f"Position updated: id={position_id}")

    return PositionDTO.model_validate(position)


@service_exception_handler
def delete_position_service(
    guild_id: int, position_id: int, db: Session, payload: Payload
) -> None:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    position = (
        db.query(Position)
        .join(Preset)
        .filter(Position.position_id == position_id, Preset.guild_id == guild_id)
        .first()
    )
    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found")

    db.delete(position)
    db.commit()
    logger.info(f"Position deleted: id={position_id}")
