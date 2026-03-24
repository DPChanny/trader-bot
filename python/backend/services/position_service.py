import logging

from sqlalchemy.orm import Session

from shared.dtos.base_dto import BaseResponseDTO
from shared.dtos.position_dto import (
    AddPositionRequestDTO,
    GetPositionDetailResponseDTO,
    GetPositionListResponseDTO,
    PositionDTO,
    UpdatePositionRequestDTO,
)
from shared.entities.position import Position

from ..utils.exception import CustomException, handle_exception


logger = logging.getLogger(__name__)


def get_position_detail_service(
    position_id: int, db: Session
) -> GetPositionDetailResponseDTO | None:
    try:
        position = (
            db.query(Position).filter(Position.position_id == position_id).first()
        )

        if position is None:
            logger.warning(f"Missing: {position_id}")
            raise CustomException(404, "Position not found.")

        return GetPositionDetailResponseDTO(
            success=True,
            code=200,
            message="ok.",
            data=PositionDTO.model_validate(position),
        )

    except Exception as e:
        handle_exception(e, db)


def add_position_service(
    dto: AddPositionRequestDTO, db: Session
) -> GetPositionDetailResponseDTO | None:
    try:
        position = Position(
            preset_id=dto.preset_id,
            name=dto.name,
            icon_url=dto.icon_url,
        )
        db.add(position)
        db.commit()
        db.refresh(position)

        logger.info(f"Added: {position.position_id}")
        return GetPositionDetailResponseDTO(
            success=True,
            code=200,
            message="ok.",
            data=PositionDTO.model_validate(position),
        )

    except Exception as e:
        handle_exception(e, db)


def get_position_list_service(db: Session) -> GetPositionListResponseDTO | None:
    try:
        positions = db.query(Position).all()
        position_dtos = [PositionDTO.model_validate(p) for p in positions]

        return GetPositionListResponseDTO(
            success=True,
            code=200,
            message="ok.",
            data=position_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_position_service(
    position_id: int, dto: UpdatePositionRequestDTO, db: Session
) -> GetPositionDetailResponseDTO | None:
    try:
        position = (
            db.query(Position).filter(Position.position_id == position_id).first()
        )
        if position is None:
            logger.warning(f"Missing: {position_id}")
            raise CustomException(404, "Position not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(position, key, value)

        db.commit()
        db.refresh(position)
        logger.info(f"Updated: {position_id}")

        return GetPositionDetailResponseDTO(
            success=True,
            code=200,
            message="ok.",
            data=PositionDTO.model_validate(position),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_position_service(
    position_id: int, db: Session
) -> BaseResponseDTO[None] | None:
    try:
        position = (
            db.query(Position).filter(Position.position_id == position_id).first()
        )
        if position is None:
            logger.warning(f"Missing: {position_id}")
            raise CustomException(404, "Position not found")

        db.delete(position)
        db.commit()
        logger.info(f"Deleted: {position_id}")

        return BaseResponseDTO(
            success=True,
            code=200,
            message="ok.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
