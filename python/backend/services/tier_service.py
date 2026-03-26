from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.tier_dto import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.entities.manager import Role
from shared.entities.tier import Tier
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
def get_tier_list_service(
    guild_id: int, preset_id: int, db: Session, payload: Payload
) -> list[TierDTO]:
    verify_role(guild_id, payload.user_id, Role.VIEWER, db)
    tiers = db.query(Tier).filter(Tier.preset_id == preset_id).all()
    return [TierDTO.model_validate(t) for t in tiers]


@service_exception_handler
def get_tier_detail_service(
    guild_id: int, preset_id: int, tier_id: int, db: Session, payload: Payload
) -> TierDTO:
    verify_role(guild_id, payload.user_id, Role.VIEWER, db)
    tier = (
        db.query(Tier)
        .filter(Tier.tier_id == tier_id, Tier.preset_id == preset_id)
        .first()
    )

    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    return TierDTO.model_validate(tier)


@service_exception_handler
def add_tier_service(
    guild_id: int, preset_id: int, dto: AddTierDTO, db: Session, payload: Payload
) -> TierDTO:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)

    tier = Tier(preset_id=preset_id, name=dto.name)
    db.add(tier)
    db.commit()
    db.refresh(tier)
    logger.info(f"Tier created: id={tier.tier_id}, name={dto.name}")
    return TierDTO.model_validate(tier)


@service_exception_handler
def update_tier_service(
    guild_id: int,
    preset_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    db: Session,
    payload: Payload,
) -> TierDTO:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    tier = (
        db.query(Tier)
        .filter(Tier.tier_id == tier_id, Tier.preset_id == preset_id)
        .first()
    )
    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(tier, key, value)

    db.commit()
    db.refresh(tier)
    logger.info(f"Tier updated: id={tier_id}")

    return TierDTO.model_validate(tier)


@service_exception_handler
def delete_tier_service(
    guild_id: int, preset_id: int, tier_id: int, db: Session, payload: Payload
) -> None:
    verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    tier = (
        db.query(Tier)
        .filter(Tier.tier_id == tier_id, Tier.preset_id == preset_id)
        .first()
    )
    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    db.delete(tier)
    db.commit()
    logger.info(f"Tier deleted: id={tier_id}")
