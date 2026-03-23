import logging

from sqlalchemy.orm import Session, joinedload

from dtos.base_dto import BaseResponseDTO
from dtos.preset_dto import (
    AddPresetRequestDTO,
    GetPresetDetailResponseDTO,
    GetPresetListResponseDTO,
    PresetDetailDTO,
    PresetDTO,
    UpdatePresetRequestDTO,
)
from entities.preset import Preset
from entities.preset_user import PresetUser
from entities.preset_user_position import PresetUserPosition
from utils.exception import CustomException, handle_exception


logger = logging.getLogger(__name__)


async def get_preset_detail_service(
    preset_id: int, db: Session
) -> GetPresetDetailResponseDTO | None:
    try:
        logger.info(f"Get: {preset_id}")
        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.tier),
                joinedload(Preset.preset_users)
                .joinedload(PresetUser.preset_user_positions)
                .joinedload(PresetUserPosition.position),
                joinedload(Preset.tiers),
                joinedload(Preset.positions),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        if not preset:
            logger.warning(f"Preset missing: {preset_id}")
            raise CustomException(404, "Preset not found.")

        preset_dto = PresetDetailDTO.model_validate(preset)

        return GetPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Preset detail retrieved successfully.",
            data=preset_dto,
        )

    except Exception as e:
        handle_exception(e, db)


def add_preset_service(
    dto: AddPresetRequestDTO, db: Session
) -> GetPresetDetailResponseDTO | None:
    try:
        logger.info(f"Add: {dto.name}")
        preset = Preset(
            name=dto.name,
            points=dto.points,
            time=dto.time,
            point_scale=dto.point_scale,
            statistics=dto.statistics,
        )
        db.add(preset)
        db.commit()
        db.refresh(preset)

        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.tier),
                joinedload(Preset.preset_users)
                .joinedload(PresetUser.preset_user_positions)
                .joinedload(PresetUserPosition.position),
                joinedload(Preset.tiers),
                joinedload(Preset.positions),
            )
            .filter(Preset.preset_id == preset.preset_id)
            .first()
        )

        logger.info(f"Added: {preset.preset_id}")
        return GetPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Preset added successfully.",
            data=PresetDetailDTO.model_validate(preset),
        )

    except Exception as e:
        handle_exception(e, db)


def get_preset_list_service(
    db: Session,
) -> GetPresetListResponseDTO | None:
    try:
        logger.info("List")
        presets = db.query(Preset).all()
        preset_dtos = [PresetDTO.model_validate(p) for p in presets]

        return GetPresetListResponseDTO(
            success=True,
            code=200,
            message="Preset list retrieved successfully.",
            data=preset_dtos,
        )

    except Exception as e:
        handle_exception(e, db)


def update_preset_service(
    preset_id: int, dto: UpdatePresetRequestDTO, db: Session
) -> GetPresetDetailResponseDTO | None:
    try:
        logger.info(f"Update: {preset_id}")
        preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
        if not preset:
            logger.warning(f"Preset missing: {preset_id}")
            raise CustomException(404, "Preset not found")

        for key, value in dto.model_dump(exclude_unset=True).items():
            setattr(preset, key, value)

        db.commit()
        db.refresh(preset)

        preset = (
            db.query(Preset)
            .options(
                joinedload(Preset.preset_users).joinedload(PresetUser.user),
                joinedload(Preset.preset_users).joinedload(PresetUser.tier),
                joinedload(Preset.preset_users)
                .joinedload(PresetUser.preset_user_positions)
                .joinedload(PresetUserPosition.position),
                joinedload(Preset.tiers),
                joinedload(Preset.positions),
            )
            .filter(Preset.preset_id == preset_id)
            .first()
        )

        return GetPresetDetailResponseDTO(
            success=True,
            code=200,
            message="Preset updated successfully.",
            data=PresetDetailDTO.model_validate(preset),
        )

    except Exception as e:
        handle_exception(e, db)


def delete_preset_service(
    preset_id: int, db: Session
) -> BaseResponseDTO[None] | None:
    try:
        logger.info(f"Delete: {preset_id}")
        preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
        if not preset:
            logger.warning(f"Preset missing: {preset_id}")
            raise CustomException(404, "Preset not found")

        db.delete(preset)
        db.commit()

        return BaseResponseDTO(
            success=True,
            code=200,
            message="Preset deleted successfully.",
            data=None,
        )

    except Exception as e:
        handle_exception(e, db)
