from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.preset import (
    CreatePresetDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.entities.preset import Preset
from shared.repositories.preset_repository import PresetRepository
from shared.utils.error import HTTPError, PresetErrorCode
from shared.utils.service import Event, http_service

from ..utils.member import verify_role


@http_service
async def get_preset_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
    event: Event,
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)
    response = PresetDTO.model_validate(preset)
    return response


@http_service
async def create_preset_service(
    guild_id: int,
    user_id: int,
    dto: CreatePresetDTO,
    session: AsyncSession,
    event: Event,
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

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
    response = PresetDTO.model_validate(preset)
    return response


@http_service
async def get_presets_service(
    guild_id: int, user_id: int, session: AsyncSession, event: Event
) -> list[PresetDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    presets = await preset_repo.get_all_by_guild_id(guild_id)
    response = [PresetDTO.model_validate(p) for p in presets]
    return response


@http_service
async def update_preset_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: UpdatePresetDTO,
    session: AsyncSession,
    event: Event,
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)

    for key in dto.model_fields_set:
        setattr(preset, key, getattr(dto, key))

    response = PresetDTO.model_validate(preset)
    return response


@http_service
async def delete_preset_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
    event: Event,
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPError(PresetErrorCode.NotFound)

    response = PresetDTO.model_validate(preset)
    await session.delete(preset)
    return response
