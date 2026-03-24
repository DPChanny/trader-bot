from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.position_dto import (
    AddPositionRequestDTO,
    PositionDTO,
    UpdatePositionRequestDTO,
)
from shared.entities.position import Position

from ..utils.exception import service_exception_handler


@service_exception_handler
def get_position_detail_service(position_id: int, db: Session) -> PositionDTO:
    position = db.query(Position).filter(Position.position_id == position_id).first()

    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found.")

    return PositionDTO.model_validate(position)


@service_exception_handler
def add_position_service(dto: AddPositionRequestDTO, db: Session) -> PositionDTO:
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
def get_position_list_service(db: Session) -> list[PositionDTO]:
    positions = db.query(Position).all()
    return [PositionDTO.model_validate(p) for p in positions]


@service_exception_handler
def update_position_service(
    position_id: int, dto: UpdatePositionRequestDTO, db: Session
) -> PositionDTO:
    position = db.query(Position).filter(Position.position_id == position_id).first()
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
def delete_position_service(position_id: int, db: Session) -> None:
    position = db.query(Position).filter(Position.position_id == position_id).first()
    if position is None:
        logger.warning(f"Position not found: id={position_id}")
        raise HTTPException(status_code=404, detail="Position not found")

    db.delete(position)
    db.commit()
    logger.info(f"Position deleted: id={position_id}")
