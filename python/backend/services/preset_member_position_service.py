from fastapi import HTTPException
from loguru import logger
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from shared.dtos.preset_member_position_dto import (
    AddPresetMemberPositionDTO,
    PresetMemberPositionDTO,
)
from shared.entities.manager import Role
from shared.entities.preset_member import PresetMember
from shared.entities.preset_member_position import PresetMemberPosition
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
def add_preset_member_position_service(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    dto: AddPresetMemberPositionDTO,
    db: Session,
    payload: Payload,
) -> PresetMemberPositionDTO:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    preset_member = (
        db.query(PresetMember)
        .filter(
            PresetMember.preset_member_id == preset_member_id,
            PresetMember.preset_id == preset_id,
        )
        .first()
    )
    if preset_member is None:
        raise HTTPException(status_code=404, detail="PresetMember not found")

    existing = (
        db.query(PresetMemberPosition)
        .filter(
            PresetMemberPosition.preset_member_id == preset_member_id,
            PresetMemberPosition.position_id == dto.position_id,
        )
        .first()
    )

    if existing:
        logger.warning(
            f"PresetMemberPosition duplicated: preset_member_id={preset_member_id}, position_id={dto.position_id}"
        )
        raise HTTPException(
            status_code=400,
            detail="PresetMemberPosition duplicated",
        )

    preset_member_position = PresetMemberPosition(
        preset_member_id=preset_member_id,
        position_id=dto.position_id,
    )
    db.add(preset_member_position)
    try:
        db.commit()
    except IntegrityError as e:
        logger.warning(
            f"PresetMemberPosition duplicated: preset_member_id={preset_member_id}, position_id={dto.position_id}"
        )
        raise HTTPException(
            status_code=400,
            detail="PresetMemberPosition duplicated",
        ) from e

    db.refresh(preset_member_position)
    logger.info(
        f"PresetMemberPosition created: id={preset_member_position.preset_member_position_id}"
    )
    return PresetMemberPositionDTO.model_validate(preset_member_position)


@service_exception_handler
def delete_preset_member_position_service(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    preset_member_position_id: int,
    db: Session,
    payload: Payload,
) -> None:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    preset_member_position = (
        db.query(PresetMemberPosition)
        .join(
            PresetMember,
            PresetMemberPosition.preset_member_id == PresetMember.preset_member_id,
        )
        .filter(
            PresetMemberPosition.preset_member_position_id == preset_member_position_id,
            PresetMember.preset_member_id == preset_member_id,
            PresetMember.preset_id == preset_id,
        )
        .first()
    )

    if preset_member_position is None:
        logger.warning(
            f"PresetMemberPosition not found: id={preset_member_position_id}"
        )
        raise HTTPException(status_code=404, detail="PresetMemberPosition not found")

    db.delete(preset_member_position)
    db.commit()
    logger.info(f"PresetMemberPosition deleted: id={preset_member_position_id}")
