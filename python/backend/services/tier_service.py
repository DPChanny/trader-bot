from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.tier_dto import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.entities.manager import Role
from shared.entities.preset import Preset
from shared.entities.tier import Tier

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
async def add_tier_service(
    guild_id: int, preset_id: int, dto: AddTierDTO, db: AsyncSession, payload: Payload
) -> TierDTO:
    await verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    result = await db.execute(
        select(Preset).where(Preset.preset_id == preset_id, Preset.guild_id == guild_id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    tier = Tier(preset_id=preset_id, name=dto.name)
    db.add(tier)
    await db.commit()
    await db.refresh(tier)
    logger.info(f"Tier created: id={tier.tier_id}, name={dto.name}")
    return TierDTO.model_validate(tier)


@service_exception_handler
async def update_tier_service(
    guild_id: int,
    preset_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    db: AsyncSession,
    payload: Payload,
) -> TierDTO:
    await verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    result = await db.execute(
        select(Tier)
        .join(Preset)
        .where(
            Tier.tier_id == tier_id,
            Tier.preset_id == preset_id,
            Preset.guild_id == guild_id,
        )
    )
    tier = result.scalar_one_or_none()
    if tier is None:
        raise HTTPException(status_code=404, detail="Tier not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(tier, key, value)

    await db.commit()
    await db.refresh(tier)
    logger.info(f"Tier updated: id={tier_id}")

    return TierDTO.model_validate(tier)


@service_exception_handler
async def delete_tier_service(
    guild_id: int, preset_id: int, tier_id: int, db: AsyncSession, payload: Payload
) -> None:
    await verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    result = await db.execute(
        select(Tier)
        .join(Preset)
        .where(
            Tier.tier_id == tier_id,
            Tier.preset_id == preset_id,
            Preset.guild_id == guild_id,
        )
    )
    tier = result.scalar_one_or_none()
    if tier is None:
        raise HTTPException(status_code=404, detail="Tier not found")

    await db.delete(tier)
    await db.commit()
    logger.info(f"Tier deleted: id={tier_id}")
