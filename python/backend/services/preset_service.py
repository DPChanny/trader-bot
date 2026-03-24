import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from shared.dtos.base_dto import BaseResponseDTO
from shared.dtos.preset_dto import (
    AddPresetRequestDTO,
    GetPresetDetailResponseDTO,
    GetPresetListResponseDTO,
    PresetDetailDTO,
    PresetDTO,
    UpdatePresetRequestDTO,
)
from shared.entities.preset import Preset
from shared.entities.preset_user import PresetUser
from shared.entities.preset_user_position import PresetUserPosition

from ..utils.exception import service_exception_handler


logger = logging.getLogger(__name__)


def _load_preset(preset_id: int, db: Session) -> Preset | None:
    return (
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


@service_exception_handler
async def get_preset_detail_service(
    preset_id: int, db: Session
) -> GetPresetDetailResponseDTO:
    preset = _load_preset(preset_id, db)

    if preset is None:
        logger.warning(f"Missing: {preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found.")

    return GetPresetDetailResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=PresetDetailDTO.model_validate(preset),
    )


@service_exception_handler
def add_preset_service(
    dto: AddPresetRequestDTO, db: Session
) -> GetPresetDetailResponseDTO:
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

    preset = _load_preset(preset.preset_id, db)

    logger.info(f"Added: {preset.preset_id}")
    return GetPresetDetailResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=PresetDetailDTO.model_validate(preset),
    )


@service_exception_handler
def get_preset_list_service(db: Session) -> GetPresetListResponseDTO:
    presets = db.query(Preset).all()
    preset_dtos = [PresetDTO.model_validate(p) for p in presets]

    return GetPresetListResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=preset_dtos,
    )


@service_exception_handler
def update_preset_service(
    preset_id: int, dto: UpdatePresetRequestDTO, db: Session
) -> GetPresetDetailResponseDTO:
    preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
    if preset is None:
        logger.warning(f"Missing: {preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)

    db.commit()
    db.refresh(preset)
    logger.info(f"Updated: {preset_id}")

    preset = _load_preset(preset_id, db)

    return GetPresetDetailResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=PresetDetailDTO.model_validate(preset),
    )


@service_exception_handler
def delete_preset_service(preset_id: int, db: Session) -> BaseResponseDTO[None]:
    preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
    if preset is None:
        logger.warning(f"Missing: {preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    db.delete(preset)
    db.commit()
    logger.info(f"Deleted: {preset_id}")

    return BaseResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=None,
    )
