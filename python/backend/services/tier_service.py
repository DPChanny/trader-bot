from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.tier import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.entities.tier import Tier
from shared.repositories.preset_repository import PresetRepository
from shared.repositories.tier_repository import TierRepository
from shared.utils.error import HTTPError, PresetErrorCode, TierErrorCode
from shared.utils.service import Event, http_service

from ..utils.member import verify_role


@http_service
async def get_tiers_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
    event: Event,
) -> list[TierDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(PresetErrorCode.NotFound)

    tier_repo = TierRepository(session)
    tiers = await tier_repo.get_all_by_preset_id(preset_id, guild_id)
    response = [TierDTO.model_validate(t) for t in tiers]
    return response


@http_service
async def get_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    tier_id: int,
    session: AsyncSession,
    event: Event,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPError(TierErrorCode.NotFound)
    response = TierDTO.model_validate(tier)
    return response


@http_service
async def add_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: AddTierDTO,
    session: AsyncSession,
    event: Event,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(PresetErrorCode.NotFound)

    tier = Tier(preset_id=preset_id, name=dto.name, icon_url=dto.icon_url)
    session.add(tier)
    await session.flush()
    response = TierDTO.model_validate(tier)
    return response


@http_service
async def update_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    session: AsyncSession,
    event: Event,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPError(TierErrorCode.NotFound)

    for key in dto.model_fields_set:
        setattr(tier, key, getattr(dto, key))

    response = TierDTO.model_validate(tier)
    return response


@http_service
async def delete_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    tier_id: int,
    session: AsyncSession,
    event: Event,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPError(TierErrorCode.NotFound)

    response = TierDTO.model_validate(tier)
    await session.delete(tier)
    return response
