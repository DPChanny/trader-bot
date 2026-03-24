from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.preset_dto import (
    AddPresetRequestDTO,
    PresetDetailDTO,
    PresetDTO,
    UpdatePresetRequestDTO,
)
from shared.entities.preset import Preset
from shared.entities.preset_user import PresetUser
from shared.entities.preset_user_position import PresetUserPosition

from ..utils.exception import service_exception_handler


def _load_preset_detail(preset_id: int, db: Session) -> Preset | None:
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
async def get_preset_detail_service(preset_id: int, db: Session) -> PresetDetailDTO:
    preset = _load_preset_detail(preset_id, db)

    if preset is None:
        logger.warning(f"Preset not found: id={preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
def add_preset_service(dto: AddPresetRequestDTO, db: Session) -> PresetDetailDTO:
    preset = Preset(
        name=dto.name,
        points=dto.points,
        time=dto.time,
        point_scale=dto.point_scale,
        statistics=dto.statistics,
    )
    db.add(preset)
    db.commit()

    preset = _load_preset_detail(preset.preset_id, db)

    logger.info(f"Preset created: id={preset.preset_id}, name={dto.name}")
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
def get_preset_list_service(db: Session) -> list[PresetDTO]:
    presets = db.query(Preset).all()
    return [PresetDTO.model_validate(p) for p in presets]


@service_exception_handler
def update_preset_service(
    preset_id: int, dto: UpdatePresetRequestDTO, db: Session
) -> PresetDetailDTO:
    preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
    if preset is None:
        logger.warning(f"Preset not found: id={preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)

    db.commit()
    logger.info(f"Preset updated: id={preset_id}")

    preset = _load_preset_detail(preset_id, db)

    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
def delete_preset_service(preset_id: int, db: Session) -> None:
    preset = db.query(Preset).filter(Preset.preset_id == preset_id).first()
    if preset is None:
        logger.warning(f"Preset not found: id={preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    db.delete(preset)
    db.commit()
    logger.info(f"Preset deleted: id={preset_id}")
