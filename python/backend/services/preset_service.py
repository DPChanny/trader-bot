from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_dto import (
    AddPresetDTO,
    PresetDetailDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.entities.member import Role
from shared.entities.preset import Preset
from shared.repositories.member_repository import MemberRepository
from shared.repositories.preset_repository import PresetRepository

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
async def get_preset_detail_service(
    guild_id: int, preset_id: int, db: AsyncSession, payload: Payload
) -> PresetDetailDTO:
    member_repo = MemberRepository(db)
    await verify_role(guild_id, payload.discord_id, member_repo, Role.VIEWER)

    preset_repo = PresetRepository(db)
    preset = await preset_repo.get_detail_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
async def add_preset_service(
    guild_id: int, dto: AddPresetDTO, db: AsyncSession, payload: Payload
) -> PresetDetailDTO:
    member_repo = MemberRepository(db)
    await verify_role(guild_id, payload.discord_id, member_repo, Role.EDITOR)

    preset_repo = PresetRepository(db)
    preset = Preset(
        guild_id=guild_id,
        name=dto.name,
        points=dto.points,
        time=dto.time,
        point_scale=dto.point_scale,
        statistics=dto.statistics,
    )
    preset_repo.add(preset)
    await preset_repo.commit()

    preset = await preset_repo.get_detail_by_id(preset.preset_id, guild_id)
    logger.info(f"Preset created: id={preset.preset_id}, name={dto.name}")
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
async def get_preset_list_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> list[PresetDTO]:
    member_repo = MemberRepository(db)
    await verify_role(guild_id, payload.discord_id, member_repo, Role.VIEWER)

    preset_repo = PresetRepository(db)
    presets = await preset_repo.get_all_by_guild(guild_id)
    return [PresetDTO.model_validate(p) for p in presets]


@service_exception_handler
async def update_preset_service(
    guild_id: int,
    preset_id: int,
    dto: UpdatePresetDTO,
    db: AsyncSession,
    payload: Payload,
) -> PresetDetailDTO:
    member_repo = MemberRepository(db)
    await verify_role(guild_id, payload.discord_id, member_repo, Role.EDITOR)

    preset_repo = PresetRepository(db)
    preset = await preset_repo.get_detail_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)

    await preset_repo.commit()
    logger.info(f"Preset updated: id={preset_id}")

    await preset_repo.refresh(preset)
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
async def delete_preset_service(
    guild_id: int, preset_id: int, db: AsyncSession, payload: Payload
) -> None:
    member_repo = MemberRepository(db)
    await verify_role(guild_id, payload.discord_id, member_repo, Role.ADMIN)

    preset_repo = PresetRepository(db)
    preset = await preset_repo.get_by_id(preset_id, guild_id)
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    await preset_repo.delete(preset)
    await preset_repo.commit()
