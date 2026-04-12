from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_dto import (
    CreatePresetDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.entities.member import Role
from shared.entities.preset import Preset
from shared.error import AppError, service_error_handler
from shared.error import Preset as PresetError
from shared.repositories.preset_repository import PresetRepository

from ..utils.member import verify_role


@service_error_handler
async def get_preset_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise AppError(PresetError.NotFound)
    return PresetDTO.model_validate(preset)


@service_error_handler
async def create_preset_service(
    guild_id: int, user_id: int, dto: CreatePresetDTO, session: AsyncSession
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
    result = PresetDTO.model_validate(preset)
    logger.bind(**result.model_dump()).info("")
    return result


@service_error_handler
async def get_preset_list_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> list[PresetDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    presets = await preset_repo.get_list_by_guild_id(guild_id)
    return [PresetDTO.model_validate(p) for p in presets]


@service_error_handler
async def update_preset_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: UpdatePresetDTO,
    session: AsyncSession,
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise AppError(PresetError.NotFound)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)

    result = PresetDTO.model_validate(preset)
    logger.bind(**result.model_dump()).info("")
    return result


@service_error_handler
async def delete_preset_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession
) -> None:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise AppError(PresetError.NotFound)

    await session.delete(preset)
    logger.bind(preset_id=preset_id).info("")
