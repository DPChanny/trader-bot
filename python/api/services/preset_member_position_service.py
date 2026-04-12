from fastapi import HTTPException
from loguru import logger
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_member_position_dto import (
    AddPresetMemberPositionDTO,
    PresetMemberPositionDTO,
)
from shared.entities.member import Role
from shared.entities.preset_member_position import PresetMemberPosition
from shared.repositories.position_repository import PositionRepository
from shared.repositories.preset_member_position_repository import (
    PresetMemberPositionRepository,
)
from shared.repositories.preset_member_repository import PresetMemberRepository

from ..utils.exception import service_exception_handler
from ..utils.member import verify_role


@service_exception_handler
async def add_preset_member_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    dto: AddPresetMemberPositionDTO,
    session: AsyncSession,
) -> PresetMemberPositionDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_member_repo = PresetMemberRepository(session)
    if (
        await preset_member_repo.get_by_id(preset_member_id, preset_id, guild_id)
        is None
    ):
        raise HTTPException(status_code=404, detail="PresetMember not found")

    position_repo = PositionRepository(session)
    if await position_repo.get_by_id(dto.position_id, preset_id, guild_id) is None:
        raise HTTPException(status_code=404, detail="Position not found")

    preset_member_position = PresetMemberPosition(
        preset_member_id=preset_member_id,
        position_id=dto.position_id,
    )
    session.add(preset_member_position)
    try:
        await session.flush()
    except IntegrityError:
        raise HTTPException(
            status_code=400,
            detail="PresetMemberPosition duplicated",
        ) from None

    logger.info(
        f"PresetMemberPosition added: id={preset_member_position.preset_member_position_id}"
    )
    return PresetMemberPositionDTO.model_validate(preset_member_position)


@service_exception_handler
async def delete_preset_member_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    preset_member_position_id: int,
    session: AsyncSession,
) -> None:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    pmp_repo = PresetMemberPositionRepository(session)
    preset_member_position = await pmp_repo.get_by_id(
        preset_member_position_id, preset_member_id, preset_id, guild_id
    )
    if preset_member_position is None:
        raise HTTPException(status_code=404, detail="PresetMemberPosition not found")

    await session.delete(preset_member_position)
    logger.info(f"PresetMemberPosition deleted: id={preset_member_position_id}")
