from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_member_position_dto import (
    AddPresetMemberPositionDTO,
    PresetMemberPositionDTO,
)
from shared.entities.manager import Role
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.entities.preset_member_position import PresetMemberPosition
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
async def add_preset_member_position_service(
    guild_id: int,
    preset_member_id: int,
    dto: AddPresetMemberPositionDTO,
    db: AsyncSession,
    payload: Payload,
) -> PresetMemberPositionDTO:
    await verify_role(guild_id, payload.discord_id, Role.EDITOR, db)
    result = await db.execute(
        select(PresetMember)
        .join(Preset, PresetMember.preset_id == Preset.preset_id)
        .where(
            PresetMember.preset_member_id == preset_member_id,
            Preset.guild_id == guild_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="PresetMember not found")

    existing_result = await db.execute(
        select(PresetMemberPosition).where(
            PresetMemberPosition.preset_member_id == preset_member_id,
            PresetMemberPosition.position_id == dto.position_id,
        )
    )
    if existing_result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=400,
            detail="PresetMemberPosition duplicated",
        )

    preset_member_position = PresetMemberPosition(
        preset_member_id=preset_member_id,
        position_id=dto.position_id,
    )
    db.add(preset_member_position)
    try:
        await db.commit()
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="PresetMemberPosition duplicated",
        ) from None

    await db.refresh(preset_member_position)
    logger.info(
        f"PresetMemberPosition created: id={preset_member_position.preset_member_position_id}"
    )
    return PresetMemberPositionDTO.model_validate(preset_member_position)


@service_exception_handler
async def delete_preset_member_position_service(
    guild_id: int,
    preset_member_id: int,
    preset_member_position_id: int,
    db: AsyncSession,
    payload: Payload,
) -> None:
    await verify_role(guild_id, payload.discord_id, Role.EDITOR, db)
    result = await db.execute(
        select(PresetMemberPosition)
        .join(
            PresetMember,
            PresetMemberPosition.preset_member_id == PresetMember.preset_member_id,
        )
        .join(Preset, PresetMember.preset_id == Preset.preset_id)
        .where(
            PresetMemberPosition.preset_member_position_id == preset_member_position_id,
            PresetMemberPosition.preset_member_id == preset_member_id,
            Preset.guild_id == guild_id,
        )
    )
    preset_member_position = result.scalar_one_or_none()

    if preset_member_position is None:
        raise HTTPException(status_code=404, detail="PresetMemberPosition not found")

    await db.delete(preset_member_position)
    await db.commit()
    logger.info(f"PresetMemberPosition deleted: id={preset_member_position_id}")
