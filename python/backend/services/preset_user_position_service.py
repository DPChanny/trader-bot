from fastapi import HTTPException
from loguru import logger
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from shared.dtos.preset_user_position_dto import (
    AddPresetUserPositionDTO,
    DeletePresetUserPositionDTO,
    PresetUserPositionDTO,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.preset import Preset
from shared.entities.preset_user import PresetUser
from shared.entities.preset_user_position import PresetUserPosition
from shared.utils.exception import service_exception_handler

from ..utils.guild_permission import get_accessible_guild_ids, require_guild_role
from ..utils.token import Payload


@service_exception_handler
def add_preset_user_position_service(
    dto: AddPresetUserPositionDTO, db: Session, payload: Payload
) -> PresetUserPositionDTO:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    preset_user = (
        db.query(PresetUser)
        .join(Preset)
        .filter(
            PresetUser.preset_user_id == dto.preset_user_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if preset_user is None:
        raise HTTPException(status_code=404, detail="PresetUser not found")

    require_guild_role(
        preset_user.preset.guild_id, payload.manager_id, GuildRole.EDITOR, db
    )

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
    dto: DeletePresetUserPositionDTO, db: Session, payload: Payload
) -> None:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    preset_user_position = (
        db.query(PresetUserPosition)
        .join(
            PresetUser, PresetUserPosition.preset_user_id == PresetUser.preset_user_id
        )
        .join(Preset, PresetUser.preset_id == Preset.preset_id)
        .filter(
            PresetUserPosition.preset_user_position_id == dto.preset_user_position_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )

    if preset_user_position is None:
        logger.warning(
            f"PresetUserPosition not found: id={dto.preset_user_position_id}"
        )
        raise HTTPException(status_code=404, detail="PresetUserPosition not found")

    require_guild_role(
        preset_user_position.preset_user.preset.guild_id,
        payload.manager_id,
        GuildRole.EDITOR,
        db,
    )

    db.delete(preset_user_position)
    db.commit()
