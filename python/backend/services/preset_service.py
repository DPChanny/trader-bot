from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.preset_dto import (
    AddPresetDTO,
    PresetDetailDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.entities.preset_member_position import PresetMemberPosition
from shared.utils.exception import service_exception_handler

from ..utils.role import get_guild_ids, verify_role
from ..utils.token import Payload


def _query_preset_detail(preset_id: int, db: Session) -> Preset | None:
    return (
        db.query(Preset)
        .options(
            joinedload(Preset.preset_members).joinedload(PresetMember.member),
            joinedload(Preset.preset_members).joinedload(PresetMember.tier),
            joinedload(Preset.preset_members)
            .joinedload(PresetMember.preset_member_positions)
            .joinedload(PresetMemberPosition.position),
            joinedload(Preset.tiers),
            joinedload(Preset.positions),
        )
        .filter(Preset.preset_id == preset_id)
        .first()
    )


@service_exception_handler
async def get_preset_detail_service(
    preset_id: int, db: Session, payload: Payload
) -> PresetDetailDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset = (
        db.query(Preset)
        .filter(Preset.preset_id == preset_id, Preset.guild_id.in_(guild_ids))
        .first()
    )

    if preset is None:
        logger.warning(f"Preset not found: id={preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    preset = _query_preset_detail(preset_id, db)
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
def add_preset_service(
    dto: AddPresetDTO, db: Session, payload: Payload
) -> PresetDetailDTO:
    verify_role(dto.guild_id, payload.user_id, GuildRole.EDITOR, db)

    preset = Preset(
        guild_id=dto.guild_id,
        name=dto.name,
        points=dto.points,
        time=dto.time,
        point_scale=dto.point_scale,
        statistics=dto.statistics,
    )
    db.add(preset)
    db.commit()

    preset = _query_preset_detail(preset.preset_id, db)
    logger.info(f"Preset created: id={preset.preset_id}, name={dto.name}")
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
def get_preset_list_service(db: Session, payload: Payload) -> list[PresetDTO]:
    guild_ids = get_guild_ids(payload.user_id, db)
    presets = db.query(Preset).filter(Preset.guild_id.in_(guild_ids)).all()
    return [PresetDTO.model_validate(p) for p in presets]


@service_exception_handler
def update_preset_service(
    preset_id: int, dto: UpdatePresetDTO, db: Session, payload: Payload
) -> PresetDetailDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset = (
        db.query(Preset)
        .filter(Preset.preset_id == preset_id, Preset.guild_id.in_(guild_ids))
        .first()
    )
    if preset is None:
        logger.warning(f"Preset not found: id={preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    verify_role(preset.guild_id, payload.user_id, GuildRole.EDITOR, db)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(preset, key, value)

    db.commit()
    logger.info(f"Preset updated: id={preset_id}")

    preset = _query_preset_detail(preset_id, db)
    return PresetDetailDTO.model_validate(preset)


@service_exception_handler
def delete_preset_service(preset_id: int, db: Session, payload: Payload) -> None:
    guild_ids = get_guild_ids(payload.user_id, db)
    preset = (
        db.query(Preset)
        .filter(Preset.preset_id == preset_id, Preset.guild_id.in_(guild_ids))
        .first()
    )
    if preset is None:
        logger.warning(f"Preset not found: id={preset_id}")
        raise HTTPException(status_code=404, detail="Preset not found")

    verify_role(preset.guild_id, payload.user_id, GuildRole.ADMIN, db)

    db.delete(preset)
    db.commit()
