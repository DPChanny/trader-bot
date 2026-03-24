import logging

from fastapi import HTTPException
from sqlalchemy.orm import Session

from shared.dtos.base_dto import BaseResponseDTO
from shared.dtos.tier_dto import (
    AddTierRequestDTO,
    GetTierDetailResponseDTO,
    GetTierListResponseDTO,
    TierDTO,
    UpdateTierRequestDTO,
)
from shared.entities.tier import Tier

from ..utils.exception import service_exception_handler


logger = logging.getLogger(__name__)


@service_exception_handler
def get_tier_detail_service(tier_id: int, db: Session) -> GetTierDetailResponseDTO:
    tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()

    if tier is None:
        logger.warning(f"Missing: {tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found.")

    return GetTierDetailResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=TierDTO.model_validate(tier),
    )


@service_exception_handler
def add_tier_service(dto: AddTierRequestDTO, db: Session) -> GetTierDetailResponseDTO:
    tier = Tier(preset_id=dto.preset_id, name=dto.name)
    db.add(tier)
    db.commit()
    db.refresh(tier)

    logger.info(f"Added: {tier.tier_id}")
    return GetTierDetailResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=TierDTO.model_validate(tier),
    )


@service_exception_handler
def get_tier_list_service(db: Session) -> GetTierListResponseDTO:
    tiers = db.query(Tier).all()
    tier_dtos = [TierDTO.model_validate(t) for t in tiers]

    return GetTierListResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=tier_dtos,
    )


@service_exception_handler
def update_tier_service(
    tier_id: int, dto: UpdateTierRequestDTO, db: Session
) -> GetTierDetailResponseDTO:
    tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
    if tier is None:
        logger.warning(f"Missing: {tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(tier, key, value)

    db.commit()
    db.refresh(tier)
    logger.info(f"Updated: {tier_id}")

    return GetTierDetailResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=TierDTO.model_validate(tier),
    )


@service_exception_handler
def delete_tier_service(tier_id: int, db: Session) -> BaseResponseDTO[None]:
    tier = db.query(Tier).filter(Tier.tier_id == tier_id).first()
    if tier is None:
        logger.warning(f"Missing: {tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    db.delete(tier)
    db.commit()
    logger.info(f"Deleted: {tier_id}")

    return BaseResponseDTO(
        success=True,
        code=200,
        message="ok.",
        data=None,
    )
