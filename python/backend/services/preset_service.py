from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.preset import (
    CopyPresetDTO,
    CreatePresetDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.dtos.subscription import Plan
from shared.entities import Position, Preset, Tier
from shared.repositories.position_repository import PositionRepository
from shared.repositories.preset_repository import PresetRepository
from shared.repositories.tier_repository import TierRepository
from shared.utils.error import HTTPError, PresetErrorCode, ValidationErrorCode
from shared.utils.service import Event, http_service
from shared.utils.verify import Quota, verify_plan, verify_quota, verify_role


@http_service
async def get_preset_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)
    return PresetDTO.model_validate(preset)


@http_service
async def create_preset_service(
    guild_id: int, user_id: int, dto: CreatePresetDTO, session: AsyncSession
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)
    await verify_plan(guild_id, Plan.PLUS, session)

    preset_repo = PresetRepository(session)
    presets = await preset_repo.get_all_by_guild_id(guild_id)
    await verify_quota(guild_id, Quota.PRESET_COUNT, len(presets) + 1, session)

    preset = Preset(
        guild_id=guild_id,
        name=dto.name,
        points=dto.points,
        timer=dto.timer,
        team_size=dto.team_size,
        point_scale=dto.point_scale,
    )
    session.add(preset)
    await session.flush()
    return PresetDTO.model_validate(preset)


@http_service
async def get_presets_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> list[PresetDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    presets = await preset_repo.get_all_by_guild_id(guild_id)
    return [PresetDTO.model_validate(p) for p in presets]


@http_service
async def update_preset_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: UpdatePresetDTO,
    session: AsyncSession,
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)
    await verify_plan(guild_id, Plan.PLUS, session)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)

    effective_points = dto.points if dto.points is not None else preset.points
    effective_team_size = (
        dto.team_size if dto.team_size is not None else preset.team_size
    )
    if effective_points < effective_team_size:
        raise HTTPError(ValidationErrorCode.Invalid)

    for key in dto.model_fields_set:
        setattr(preset, key, getattr(dto, key))

    return PresetDTO.model_validate(preset)


@http_service
async def delete_preset_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession, event: Event
) -> None:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)

    event.result = PresetDTO.model_validate(preset)
    await session.delete(preset)


@http_service
async def copy_preset_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: CopyPresetDTO,
    session: AsyncSession,
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)
    await verify_role(dto.target_guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    target_presets = await preset_repo.get_all_by_guild_id(dto.target_guild_id)
    await verify_quota(
        dto.target_guild_id, Quota.PRESET_COUNT, len(target_presets) + 1, session
    )

    source_preset = await preset_repo.get_by_id(preset_id, guild_id)
    if source_preset is None:
        raise HTTPError(PresetErrorCode.NotFound)

    target_preset = Preset(
        guild_id=dto.target_guild_id,
        name=source_preset.name,
        points=source_preset.points,
        timer=source_preset.timer,
        team_size=source_preset.team_size,
        point_scale=source_preset.point_scale,
    )
    session.add(target_preset)
    await session.flush()

    tier_repo = TierRepository(session)
    tiers = await tier_repo.get_all_by_preset_id(preset_id, guild_id)
    for tier in tiers:
        session.add(
            Tier(
                preset_id=target_preset.preset_id,
                name=tier.name,
                icon_url=tier.icon_url,
            )
        )

    position_repo = PositionRepository(session)
    positions = await position_repo.get_all_by_preset_id(preset_id, guild_id)
    for position in positions:
        session.add(
            Position(
                preset_id=target_preset.preset_id,
                name=position.name,
                icon_url=position.icon_url,
            )
        )

    await session.flush()
    return PresetDTO.model_validate(target_preset)
