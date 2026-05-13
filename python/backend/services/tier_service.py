from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.subscription import Plan
from shared.dtos.tier import AddTierDTO, TierDTO, UpdateTierDTO
from shared.entities import Tier
from shared.repositories.preset_repository import PresetRepository
from shared.repositories.tier_repository import TierRepository
from shared.utils.error import HTTPError, NotFoundErrorCode
from shared.utils.service import Event, http_service

from shared.utils.verify import verify_plan, verify_role


@http_service
async def get_tiers_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession
) -> list[TierDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(NotFoundErrorCode.Preset)

    tier_repo = TierRepository(session)
    tiers = await tier_repo.get_all_by_preset_id(preset_id, guild_id)
    return [TierDTO.model_validate(t) for t in tiers]


@http_service
async def get_tier_service(
    guild_id: int, user_id: int, preset_id: int, tier_id: int, session: AsyncSession
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPError(NotFoundErrorCode.Tier)
    return TierDTO.model_validate(tier)


@http_service
async def add_tier_service(
    guild_id: int, user_id: int, preset_id: int, dto: AddTierDTO, session: AsyncSession
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)
    await verify_plan(guild_id, Plan.PLUS, session)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(NotFoundErrorCode.Preset)

    tier = Tier(preset_id=preset_id, name=dto.name, icon_url=dto.icon_url)
    session.add(tier)
    await session.flush()
    return TierDTO.model_validate(tier)


@http_service
async def update_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    session: AsyncSession,
) -> TierDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)
    await verify_plan(guild_id, Plan.PLUS, session)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPError(NotFoundErrorCode.Tier)

    for key in dto.model_fields_set:
        setattr(tier, key, getattr(dto, key))

    return TierDTO.model_validate(tier)


@http_service
async def delete_tier_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    tier_id: int,
    session: AsyncSession,
    event: Event,
) -> None:
    await verify_role(guild_id, user_id, session, Role.ADMIN)
    await verify_plan(guild_id, Plan.PLUS, session)

    tier_repo = TierRepository(session)
    tier = await tier_repo.get_by_id(tier_id, preset_id, guild_id)
    if tier is None:
        raise HTTPError(NotFoundErrorCode.Tier)

    event.result = TierDTO.model_validate(tier)
    await session.delete(tier)
