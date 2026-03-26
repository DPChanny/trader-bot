from fastapi import HTTPException
from loguru import logger
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from shared.dtos.preset_user_position_dto import (
    AddPresetUserPositionDTO,
    DeletePresetUserPositionDTO,
    PresetUserPositionDTO,
)
from shared.entities.preset_user_position import PresetUserPosition
from shared.utils.exception import service_exception_handler


@service_exception_handler
def add_preset_user_position_service(
    dto: AddPresetUserPositionDTO, db: Session
) -> PresetUserPositionDTO:
    existing = (
        db.query(PresetUserPosition)
        .filter(
            PresetUserPosition.preset_user_id == dto.preset_user_id,
            PresetUserPosition.position_id == dto.position_id,
        )
        .first()
    )

    if existing:
        logger.warning(
            f"PresetUserPosition duplicated: preset_user_id={dto.preset_user_id}, position_id={dto.position_id}"
        )
        raise HTTPException(
            status_code=400,
            detail="PresetUserPosition duplicated",
        )

    preset_user_position = PresetUserPosition(
        preset_user_id=dto.preset_user_id,
        position_id=dto.position_id,
    )
    db.add(preset_user_position)
    try:
        db.commit()
    except IntegrityError as e:
        logger.warning(
            f"PresetUserPosition duplicated: preset_user_id={dto.preset_user_id}, position_id={dto.position_id}"
        )
        raise HTTPException(
            status_code=400,
            detail="PresetUserPosition duplicated",
        ) from e

    db.refresh(preset_user_position)
    logger.info(
        f"PresetUserPosition created: id={preset_user_position.preset_user_position_id}"
    )
    return PresetUserPositionDTO.model_validate(preset_user_position)


@service_exception_handler
def delete_preset_user_position_service(
    dto: DeletePresetUserPositionDTO, db: Session
) -> None:
    preset_user_position = (
        db.query(PresetUserPosition)
        .filter(
            PresetUserPosition.preset_user_position_id == dto.preset_user_position_id
        )
        .first()
    )

    if preset_user_position is None:
        logger.warning(
            f"PresetUserPosition not found: id={dto.preset_user_position_id}"
        )
        raise HTTPException(status_code=404, detail="PresetUserPosition not found")

    db.delete(preset_user_position)
    db.commit()
    logger.info(f"PresetUserPosition deleted: id={dto.preset_user_position_id}")
