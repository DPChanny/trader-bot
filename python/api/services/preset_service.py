from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_dto import (
    CreatePresetDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.entities.member import Role
from shared.entities.preset import Preset
from shared.repositories.preset_repository import PresetRepository

from ..utils.exception import service_exception_handler
from ..utils.member import verify_role


@service_exception_handler
async def get_preset_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")
    return PresetDTO.model_validate(preset)


@service_exception_handler
async def create_preset_service(
    guild_id: int, user_id: int, dto: CreatePresetDTO, session: AsyncSession
) -> PresetDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
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
    await session.refresh(preset)
    logger.info(f"Preset created: id={preset.preset_id}, name={dto.name}")
    return PresetDTO.model_validate(preset)


@service_exception_handler
async def get_preset_list_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> list[PresetDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    presets = await preset_repo.get_list_by_guild_id(guild_id)
    return [PresetDTO.model_validate(p) for p in presets]


@service_exception_handler
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
        raise HTTPException(status_code=404, detail="Preset not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)

    logger.info(f"Preset updated: id={preset_id}")

    await session.flush()
    await session.refresh(preset)
    return PresetDTO.model_validate(preset)


@service_exception_handler
async def delete_preset_service(
    guild_id: int, user_id: int, preset_id: int, session: AsyncSession
) -> None:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_repo = PresetRepository(session)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    await session.delete(preset)
