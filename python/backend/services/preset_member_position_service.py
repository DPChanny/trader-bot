from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.preset_member_position import (
    AddPresetMemberPositionDTO,
    PresetMemberPositionDTO,
)
from shared.entities.preset_member_position import PresetMemberPosition
from shared.repositories.position_repository import PositionRepository
from shared.repositories.preset_member_position_repository import (
    PresetMemberPositionRepository,
)
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.utils.error import (
    HTTPError,
    PositionErrorCode,
    PresetMemberErrorCode,
    PresetMemberPositionErrorCode,
)
from shared.utils.service import http_service

from ..utils.member import verify_role


@http_service
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
        raise HTTPError(PresetMemberErrorCode.NotFound)

    position_repo = PositionRepository(session)
    if await position_repo.get_by_id(dto.position_id, preset_id, guild_id) is None:
        raise HTTPError(PositionErrorCode.NotFound)

    preset_member_position = PresetMemberPosition(
        preset_member_id=preset_member_id,
        position_id=dto.position_id,
    )
    session.add(preset_member_position)
    try:
        await session.flush()
    except IntegrityError:
        raise HTTPError(PresetMemberPositionErrorCode.Duplicated) from None

    return PresetMemberPositionDTO.model_validate(preset_member_position)


@http_service
async def delete_preset_member_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    preset_member_position_id: int,
    session: AsyncSession,
) -> PresetMemberPositionDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    pmp_repo = PresetMemberPositionRepository(session)
    preset_member_position = await pmp_repo.get_by_id(
        preset_member_position_id, preset_member_id, preset_id, guild_id
    )
    if preset_member_position is None:
        raise HTTPError(PresetMemberPositionErrorCode.NotFound)

    response = PresetMemberPositionDTO.model_validate(preset_member_position)
    await session.delete(preset_member_position)
    return response
