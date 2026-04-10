from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.tier_dto import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.entities.member import Role
from shared.entities.tier import Tier
from shared.repositories.preset_repository import PresetRepository
from shared.repositories.tier_repository import TierRepository

from ..utils.exception import service_exception_handler
from ..utils.member import verify_role


@service_exception_handler
async def add_tier_service(
    guild_id: int,
    discord_id: int,
    preset_id: int,
    dto: AddTierDTO,
    session: AsyncSession,
) -> TierDTO:
    await verify_role(guild_id, discord_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    tier_repo = TierRepository(session)
    tier = Tier(preset_id=preset_id, name=dto.name)
    tier_repo.add(tier)
    await tier_repo.commit()
    await tier_repo.refresh(tier)
    logger.info(f"Tier created: id={tier.tier_id}, name={dto.name}")
    return TierDTO.model_validate(tier)


@service_exception_handler
async def update_tier_service(
    guild_id: int,
    discord_id: int,
    preset_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    session: AsyncSession,
) -> TierDTO:
    await verify_role(guild_id, discord_id, session, Role.EDITOR)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPException(status_code=404, detail="Tier not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(tier, key, value)

    await tier_repo.commit()
    await tier_repo.refresh(tier)
    logger.info(f"Tier updated: id={tier_id}")

    return TierDTO.model_validate(tier)


@service_exception_handler
async def delete_tier_service(
    guild_id: int, discord_id: int, preset_id: int, tier_id: int, session: AsyncSession
) -> None:
    await verify_role(guild_id, discord_id, session, Role.EDITOR)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPException(status_code=404, detail="Tier not found")

    await tier_repo.delete(tier)
    await tier_repo.commit()
    logger.info(f"Tier deleted: id={tier_id}")
