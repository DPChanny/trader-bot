from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.tier_dto import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.preset import Preset
from shared.entities.tier import Tier
from shared.utils.exception import service_exception_handler

from ..utils.guild_permission import get_accessible_guild_ids, require_guild_role
from ..utils.token import Payload


@service_exception_handler
def get_tier_list_service(db: Session, payload: Payload) -> list[TierDTO]:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    tiers = db.query(Tier).join(Preset).filter(Preset.guild_id.in_(guild_ids)).all()
    return [TierDTO.model_validate(t) for t in tiers]


@service_exception_handler
def get_tier_detail_service(tier_id: int, db: Session, payload: Payload) -> TierDTO:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    tier = (
        db.query(Tier)
        .join(Preset)
        .filter(Tier.tier_id == tier_id, Preset.guild_id.in_(guild_ids))
        .first()
    )

    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    return TierDTO.model_validate(tier)


@service_exception_handler
def add_tier_service(dto: AddTierDTO, db: Session, payload: Payload) -> TierDTO:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    preset = (
        db.query(Preset)
        .filter(
            Preset.preset_id == dto.preset_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    require_guild_role(preset.guild_id, payload.manager_id, GuildRole.EDITOR, db)

    tier = Tier(preset_id=dto.preset_id, name=dto.name)
    db.add(tier)
    db.commit()
    db.refresh(tier)
    logger.info(f"Tier created: id={tier.tier_id}, name={dto.name}")
    return TierDTO.model_validate(tier)


@service_exception_handler
def update_tier_service(
    tier_id: int, dto: UpdateTierDTO, db: Session, payload: Payload
) -> TierDTO:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    tier = (
        db.query(Tier)
        .join(Preset)
        .filter(Tier.tier_id == tier_id, Preset.guild_id.in_(guild_ids))
        .first()
    )
    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    require_guild_role(tier.preset.guild_id, payload.manager_id, GuildRole.EDITOR, db)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(tier, key, value)

    db.commit()
    db.refresh(tier)
    logger.info(f"Tier updated: id={tier_id}")

    return TierDTO.model_validate(tier)


@service_exception_handler
def delete_tier_service(tier_id: int, db: Session, payload: Payload) -> None:
    guild_ids = get_accessible_guild_ids(payload.manager_id, db)
    tier = (
        db.query(Tier)
        .join(Preset)
        .filter(Tier.tier_id == tier_id, Preset.guild_id.in_(guild_ids))
        .first()
    )
    if tier is None:
        logger.warning(f"Tier not found: id={tier_id}")
        raise HTTPException(status_code=404, detail="Tier not found")

    require_guild_role(tier.preset.guild_id, payload.manager_id, GuildRole.EDITOR, db)

    db.delete(tier)
    db.commit()
    logger.info(f"Tier deleted: id={tier_id}")
