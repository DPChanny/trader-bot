from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.preset_member_dto import (
    AddPresetMemberDTO,
    PresetMemberDetailDTO,
    UpdatePresetMemberDTO,
)
from shared.entities.member import Member, Role
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.entities.tier import Tier

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


async def _query_preset_member_detail(
    preset_member_id: int,
    db: AsyncSession,
) -> PresetMember | None:
    stmt = (
        select(PresetMember)
        .options(
            joinedload(PresetMember.member),
            joinedload(PresetMember.preset_member_positions),
        )
        .where(PresetMember.preset_member_id == preset_member_id)
    )
    result = await db.execute(stmt)
    return result.unique().scalar_one_or_none()


@service_exception_handler
async def add_preset_member_service(
    guild_id: int,
    preset_id: int,
    dto: AddPresetMemberDTO,
    db: AsyncSession,
    payload: Payload,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, payload.discord_id, db, Role.EDITOR)

    result = await db.execute(
        select(Preset).where(Preset.preset_id == preset_id, Preset.guild_id == guild_id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    result = await db.execute(
        select(Member).where(
            Member.member_id == dto.member_id, Member.guild_id == guild_id
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Member not found")

    if dto.tier_id is not None:
        result = await db.execute(
            select(Tier)
            .join(Preset, Tier.preset_id == Preset.preset_id)
            .where(Tier.tier_id == dto.tier_id, Preset.guild_id == guild_id)
        )
        if result.scalar_one_or_none() is None:
            raise HTTPException(status_code=404, detail="Tier not found")

    preset_member = PresetMember(
        preset_id=preset_id,
        member_id=dto.member_id,
        tier_id=dto.tier_id,
        is_leader=dto.is_leader,
    )
    db.add(preset_member)
    await db.commit()
    logger.info(f"PresetMember created: id={preset_member.preset_member_id}")

    preset_member = await _query_preset_member_detail(
        preset_member.preset_member_id, db
    )
    return PresetMemberDetailDTO.model_validate(preset_member)


@service_exception_handler
async def update_preset_member_service(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    dto: UpdatePresetMemberDTO,
    db: AsyncSession,
    payload: Payload,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, payload.discord_id, db, Role.EDITOR)
    result = await db.execute(
        select(PresetMember)
        .join(Preset)
        .where(
            PresetMember.preset_member_id == preset_member_id,
            PresetMember.preset_id == preset_id,
            Preset.guild_id == guild_id,
        )
    )
    preset_member = result.scalar_one_or_none()
    if preset_member is None:
        raise HTTPException(status_code=404, detail="PresetMember not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        if key == "tier_id" and value is not None:
            tier_result = await db.execute(
                select(Tier)
                .join(Preset, Tier.preset_id == Preset.preset_id)
                .where(Tier.tier_id == value, Preset.guild_id == guild_id)
            )
            if tier_result.scalar_one_or_none() is None:
                raise HTTPException(status_code=404, detail="Tier not found")
        setattr(preset_member, key, value)

    await db.commit()
    logger.info(f"PresetMember updated: id={preset_member_id}")

    preset_member = await _query_preset_member_detail(preset_member_id, db)
    return PresetMemberDetailDTO.model_validate(preset_member)


@service_exception_handler
async def delete_preset_member_service(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    db: AsyncSession,
    payload: Payload,
) -> None:
    await verify_role(guild_id, payload.discord_id, db, Role.EDITOR)
    result = await db.execute(
        select(PresetMember)
        .join(Preset)
        .where(
            PresetMember.preset_member_id == preset_member_id,
            PresetMember.preset_id == preset_id,
            Preset.guild_id == guild_id,
        )
    )
    preset_member = result.scalar_one_or_none()
    if preset_member is None:
        raise HTTPException(status_code=404, detail="PresetMember not found")

    await db.delete(preset_member)
    await db.commit()
    logger.info(f"PresetMember deleted: id={preset_member_id}")
