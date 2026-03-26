from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.preset_member_dto import (
    AddPresetMemberDTO,
    PresetMemberDetailDTO,
    PresetMemberDTO,
    UpdatePresetMemberDTO,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.member import Member
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.entities.preset_member_position import PresetMemberPosition
from shared.utils.exception import service_exception_handler

from ..utils.role import get_guild_ids, verify_role
from ..utils.token import Payload


def _query_preset_member_detail(
    preset_member_id: int, db: Session
) -> PresetMember | None:
    return (
        db.query(PresetMember)
        .options(
            joinedload(PresetMember.member),
            joinedload(PresetMember.tier),
            joinedload(PresetMember.preset_member_positions).joinedload(
                PresetMemberPosition.position
            ),
        )
        .filter(PresetMember.preset_member_id == preset_member_id)
        .first()
    )


@service_exception_handler
async def get_preset_member_detail_service(
    preset_member_id: int, db: Session, payload: Payload
) -> PresetMemberDetailDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    ownership = (
        db.query(PresetMember)
        .join(Preset)
        .filter(
            PresetMember.preset_member_id == preset_member_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )

    if ownership is None:
        logger.warning(f"PresetMember not found: id={preset_member_id}")
        raise HTTPException(status_code=404, detail="PresetMember not found")

    preset_member = _query_preset_member_detail(preset_member_id, db)
    return PresetMemberDetailDTO.model_validate(preset_member)


@service_exception_handler
async def add_preset_member_service(
    dto: AddPresetMemberDTO, db: Session, payload: Payload
) -> PresetMemberDetailDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset = (
        db.query(Preset)
        .filter(
            Preset.preset_id == dto.preset_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if preset is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    verify_role(preset.guild_id, payload.user_id, GuildRole.EDITOR, db)

    member = (
        db.query(Member)
        .filter(Member.member_id == dto.member_id, Member.guild_id == preset.guild_id)
        .first()
    )
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    preset_member = PresetMember(
        preset_id=dto.preset_id,
        member_id=dto.member_id,
        tier_id=dto.tier_id,
        is_leader=dto.is_leader,
    )
    db.add(preset_member)
    db.commit()
    logger.info(f"PresetMember created: id={preset_member.preset_member_id}")

    preset_member = _query_preset_member_detail(preset_member.preset_member_id, db)
    return PresetMemberDetailDTO.model_validate(preset_member)


@service_exception_handler
def get_preset_member_list_service(
    db: Session, payload: Payload
) -> list[PresetMemberDTO]:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset_members = (
        db.query(PresetMember).join(Preset).filter(Preset.guild_id.in_(guild_ids)).all()
    )
    return [PresetMemberDTO.model_validate(pm) for pm in preset_members]


@service_exception_handler
async def update_preset_member_service(
    preset_member_id: int, dto: UpdatePresetMemberDTO, db: Session, payload: Payload
) -> PresetMemberDetailDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset_member = (
        db.query(PresetMember)
        .join(Preset)
        .filter(
            PresetMember.preset_member_id == preset_member_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if preset_member is None:
        logger.warning(f"PresetMember not found: id={preset_member_id}")
        raise HTTPException(status_code=404, detail="PresetMember not found")

    verify_role(preset_member.preset.guild_id, payload.user_id, GuildRole.EDITOR, db)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset_member, key, value)

    db.commit()
    logger.info(f"PresetMember updated: id={preset_member_id}")

    preset_member = _query_preset_member_detail(preset_member_id, db)
    return PresetMemberDetailDTO.model_validate(preset_member)


@service_exception_handler
def delete_preset_member_service(
    preset_member_id: int, db: Session, payload: Payload
) -> None:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset_member = (
        db.query(PresetMember)
        .join(Preset)
        .filter(
            PresetMember.preset_member_id == preset_member_id,
            Preset.guild_id.in_(guild_ids),
        )
        .first()
    )
    if preset_member is None:
        logger.warning(f"PresetMember not found: id={preset_member_id}")
        raise HTTPException(status_code=404, detail="PresetMember not found")

    verify_role(preset_member.preset.guild_id, payload.user_id, GuildRole.EDITOR, db)

    db.delete(preset_member)
    db.commit()
    logger.info(f"PresetMember deleted: id={preset_member_id}")
