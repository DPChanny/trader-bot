import logging

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from shared.dtos.base_dto import BaseResponseDTO
from shared.dtos.preset_user_position_dto import (
    AddPresetUserPositionRequestDTO,
    DeletePresetUserPositionRequestDTO,
    GetPresetUserPositionResponseDTO,
    PresetUserPositionDTO,
)
from shared.entities.preset_user_position import PresetUserPosition

from ..utils.exception import CustomException, handle_exception


logger = logging.getLogger(__name__)


def add_preset_user_position_service(
    dto: AddPresetUserPositionRequestDTO, db: Session
) -> GetPresetUserPositionResponseDTO | None:
    try:
        existing = (
            db.query(PresetUserPosition)
            .filter(
                PresetUserPosition.preset_user_id == dto.preset_user_id,
                PresetUserPosition.position_id == dto.position_id,
            )
            .first()
        )

        if existing:
            logger.warning("Duplicate")
            raise CustomException(
                400, "This position is already assigned to the preset_user."
            )

        preset_user_position = PresetUserPosition(
            preset_user_id=dto.preset_user_id,
            position_id=dto.position_id,
        )
        db.add(preset_user_position)
        try:
            db.commit()
        except IntegrityError as e:
            db.rollback()
            raise CustomException(
                400, "This position is already assigned to the preset_user."
            ) from e
        db.refresh(preset_user_position)

        logger.info(f"Added: {preset_user_position.preset_user_position_id}")
        return GetPresetUserPositionResponseDTO(
            success=True,
            code=200,
            message="ok.",
            data=PresetUserPositionDTO.model_validate(preset_user_position),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_preset_user_position_service(
    dto: DeletePresetUserPositionRequestDTO, db: Session
) -> BaseResponseDTO | None:
    try:
        preset_user_position = (
            db.query(PresetUserPosition)
            .filter(
                PresetUserPosition.preset_user_position_id
                == dto.preset_user_position_id
            )
            .first()
        )

        if preset_user_position is None:
            logger.warning(f"Missing: {dto.preset_user_position_id}")
            raise CustomException(404, "PresetUserPosition not found.")

        db.delete(preset_user_position)
        db.commit()
        logger.info(f"Deleted: {dto.preset_user_position_id}")

        return BaseResponseDTO(
            success=True,
            code=200,
            message="ok.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
