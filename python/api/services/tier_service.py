from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.tier_dto import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.entities.member import Role
from shared.entities.tier import Tier
from shared.error import AppError, service_error_handler
from shared.error import Preset as PresetError
from shared.error import Tier as TierError
from shared.repositories.preset_repository import PresetRepository
from shared.repositories.tier_repository import TierRepository

from ..utils.member import verify_role


@service_error_handler
async def get_tier_list_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
) -> list[TierDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise AppError(PresetError.NotFound)

    tier_repo = TierRepository(session)
    tiers = await tier_repo.get_list_by_preset_id(preset_id, guild_id)
    return [TierDTO.model_validate(t) for t in tiers]


@service_error_handler
async def get_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    tier_id: int,
    session: AsyncSession,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise AppError(TierError.NotFound)
    return TierDTO.model_validate(tier)


@service_error_handler
async def add_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: AddTierDTO,
    session: AsyncSession,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise AppError(PresetError.NotFound)

    tier = Tier(preset_id=preset_id, name=dto.name, icon_url=dto.icon_url)
    session.add(tier)
    await session.flush()
    result = TierDTO.model_validate(tier)
    logger.bind(**result.model_dump()).info("")
    return result


@service_error_handler
async def update_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    session: AsyncSession,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise AppError(TierError.NotFound)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(tier, key, value)

    result = TierDTO.model_validate(tier)
    logger.bind(**result.model_dump()).info("")
    return result


@service_error_handler
async def delete_tier_service(
    guild_id: int, user_id: int, preset_id: int, tier_id: int, session: AsyncSession
) -> None:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise AppError(TierError.NotFound)

    await session.delete(tier)
    logger.bind(tier_id=tier_id).info("")
