from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.preset_user_dto import (
    AddPresetUserRequestDTO,
    PresetUserDetailDTO,
    PresetUserDTO,
    UpdatePresetUserRequestDTO,
)
from shared.entities.preset_user import PresetUser

from ..utils.exception import service_exception_handler


def _load_preset_user(preset_user_id: int, db: Session) -> PresetUser | None:
    return (
        db.query(PresetUser)
        .options(
            joinedload(PresetUser.user),
            joinedload(PresetUser.tier),
            joinedload(PresetUser.preset_user_positions),
        )
        .filter(PresetUser.preset_user_id == preset_user_id)
        .first()
    )


@service_exception_handler
async def get_preset_user_detail_service(
    preset_user_id: int, db: Session
) -> PresetUserDetailDTO:
    preset_user = _load_preset_user(preset_user_id, db)

    if preset_user is None:
        logger.warning(f"PresetUser not found: id={preset_user_id}")
        raise HTTPException(status_code=404, detail="Preset user not found.")

    return PresetUserDetailDTO.model_validate(preset_user)


@service_exception_handler
async def add_preset_user_service(
    dto: AddPresetUserRequestDTO, db: Session
) -> PresetUserDetailDTO:
    preset_user = PresetUser(
        preset_id=dto.preset_id,
        user_id=dto.user_id,
        tier_id=dto.tier_id,
        is_leader=dto.is_leader,
    )
    db.add(preset_user)
    db.commit()
    db.refresh(preset_user)
    logger.info(f"PresetUser created: id={preset_user.preset_user_id}")

    preset_user = _load_preset_user(preset_user.preset_user_id, db)

    return PresetUserDetailDTO.model_validate(preset_user)


@service_exception_handler
def get_preset_user_list_service(db: Session) -> list[PresetUserDTO]:
    preset_users = db.query(PresetUser).all()
    return [PresetUserDTO.model_validate(pu) for pu in preset_users]


@service_exception_handler
async def update_preset_user_service(
    preset_user_id: int, dto: UpdatePresetUserRequestDTO, db: Session
) -> PresetUserDetailDTO:
    preset_user = (
        db.query(PresetUser).filter(PresetUser.preset_user_id == preset_user_id).first()
    )
    if preset_user is None:
        raise HTTPException(status_code=404, detail="Preset user not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset_user, key, value)

    db.commit()
    db.refresh(preset_user)
    logger.info(f"PresetUser updated: id={preset_user_id}")

    preset_user = _load_preset_user(preset_user_id, db)

    return PresetUserDetailDTO.model_validate(preset_user)


@service_exception_handler
def delete_preset_user_service(preset_user_id: int, db: Session) -> None:
    preset_user = (
        db.query(PresetUser).filter(PresetUser.preset_user_id == preset_user_id).first()
    )
    if preset_user is None:
        raise HTTPException(status_code=404, detail="Preset user not found")

    db.delete(preset_user)
    db.commit()
    logger.info(f"PresetUser deleted: id={preset_user_id}")
