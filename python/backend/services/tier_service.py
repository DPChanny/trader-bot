from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.tier_dto import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.entities.tier import Tier
from shared.exception import service_exception_handler


@service_exception_handler
def get_tier_detail_service(tier_id: int, db: Session) -> TierDTO:
    tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()

    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    return TierDTO.model_validate(tier)


@service_exception_handler
def add_tier_service(dto: AddTierDTO, db: Session) -> TierDTO:
    tier = Tier(preset_id=dto.preset_id, name=dto.name)
    db.add(tier)
    db.commit()
    db.refresh(tier)
    logger.info(f"Tier created: id={tier.tier_id}, name={dto.name}")
    return TierDTO.model_validate(tier)


@service_exception_handler
def get_tier_list_service(db: Session) -> list[TierDTO]:
    tiers = db.query(Tier).all()
    return [TierDTO.model_validate(t) for t in tiers]


@service_exception_handler
def update_tier_service(
    tier_id: int, dto: UpdateTierDTO, db: Session
) -> TierDTO:
    tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
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
def delete_tier_service(tier_id: int, db: Session) -> None:
    tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    db.delete(tier)
    db.commit()
    logger.info(f"Tier deleted: id={tier_id}")
