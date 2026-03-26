from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.position_dto import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.position import Position
from shared.entities.preset import Preset
from shared.utils.exception import service_exception_handler

from ..utils.role import get_guild_ids, verify_role
from ..utils.token import Payload


@service_exception_handler
def get_position_list_service(db: Session, payload: Payload) -> list[PositionDTO]:
    guild_ids = get_guild_ids(payload.user_id, db)
    positions = (
        db.query(Position).join(Preset).filter(Preset.guild_id.in_(guild_ids)).all()
    )
    return [PositionDTO.model_validate(p) for p in positions]


@service_exception_handler
def get_position_detail_service(
    position_id: int, db: Session, payload: Payload
) -> PositionDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    position = (
        db.query(Position)
        .join(Preset)
        .filter(
            Position.position_id == position_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )

    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found")

    return PositionDTO.model_validate(position)


@service_exception_handler
def add_position_service(
    dto: AddPositionDTO, db: Session, payload: Payload
) -> PositionDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset = (
        db.query(Preset)
        .filter(
            Preset.preset_id == dto.preset_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    verify_role(preset.guild_id, payload.user_id, GuildRole.EDITOR, db)

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
    position_id: int, dto: UpdatePositionDTO, db: Session, payload: Payload
) -> PositionDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    position = (
        db.query(Position)
        .join(Preset)
        .filter(
            Position.position_id == position_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found")

    verify_role(position.preset.guild_id, payload.user_id, GuildRole.EDITOR, db)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(position, key, value)

    db.commit()
    db.refresh(position)
    logger.info(f"Position updated: id={position_id}")

    return PositionDTO.model_validate(position)


@service_exception_handler
def delete_position_service(position_id: int, db: Session, payload: Payload) -> None:
    guild_ids = get_guild_ids(payload.user_id, db)
    position = (
        db.query(Position)
        .join(Preset)
        .filter(
            Position.position_id == position_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found")

    verify_role(position.preset.guild_id, payload.user_id, GuildRole.EDITOR, db)

    db.delete(position)
    db.commit()
    logger.info(f"Position deleted: id={position_id}")
