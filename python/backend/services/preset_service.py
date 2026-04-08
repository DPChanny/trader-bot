from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.preset_dto import (
    AddPresetDTO,
    PresetDetailDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.entities.manager import Role
from shared.entities.member import Member
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


async def _query_preset_detail(preset_id: int, db: AsyncSession) -> Preset | None:
    result = await db.execute(
        select(Preset)
        .options(
            joinedload(Preset.preset_members)
            .joinedload(PresetMember.member)
            .joinedload(Member.discord),
            joinedload(Preset.preset_members).joinedload(
                PresetMember.preset_member_positions
            ),
            joinedload(Preset.tiers),
            joinedload(Preset.positions),
        )
        .where(Preset.preset_id == preset_id)
    )
    return result.unique().scalar_one_or_none()


@service_exception_handler
async def get_preset_detail_service(
    guild_id: int, preset_id: int, db: AsyncSession, payload: Payload
) -> PresetDetailDTO:
    await verify_role(guild_id, payload.discord_id, Role.VIEWER, db)
    result = await db.execute(
        select(Preset).where(Preset.preset_id == preset_id, Preset.guild_id == guild_id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    preset = await _query_preset_detail(preset_id, db)
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
async def add_preset_service(
    guild_id: int, dto: AddPresetDTO, db: AsyncSession, payload: Payload
) -> PresetDetailDTO:
    await verify_role(guild_id, payload.discord_id, Role.EDITOR, db)

    preset = Preset(
        guild_id=guild_id,
        name=dto.name,
        points=dto.points,
        time=dto.time,
        point_scale=dto.point_scale,
        statistics=dto.statistics,
    )
    db.add(preset)
    await db.commit()

    preset = await _query_preset_detail(preset.preset_id, db)
    logger.info(f"Preset created: id={preset.preset_id}, name={dto.name}")
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
async def get_preset_list_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> list[PresetDTO]:
    await verify_role(guild_id, payload.discord_id, Role.VIEWER, db)
    result = await db.execute(select(Preset).where(Preset.guild_id == guild_id))
    presets = result.scalars().all()
    return [PresetDTO.model_validate(p) for p in presets]


@service_exception_handler
async def update_preset_service(
    guild_id: int,
    preset_id: int,
    dto: UpdatePresetDTO,
    db: AsyncSession,
    payload: Payload,
) -> PresetDetailDTO:
    await verify_role(guild_id, payload.discord_id, Role.EDITOR, db)
    result = await db.execute(
        select(Preset).where(Preset.preset_id == preset_id, Preset.guild_id == guild_id)
    )
    preset = result.scalar_one_or_none()
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)

    await db.commit()
    logger.info(f"Preset updated: id={preset_id}")

    preset = await _query_preset_detail(preset_id, db)
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
async def delete_preset_service(
    guild_id: int, preset_id: int, db: AsyncSession, payload: Payload
) -> None:
    await verify_role(guild_id, payload.discord_id, Role.ADMIN, db)
    result = await db.execute(
        select(Preset).where(Preset.preset_id == preset_id, Preset.guild_id == guild_id)
    )
    preset = result.scalar_one_or_none()
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    await db.delete(preset)
    await db.commit()
