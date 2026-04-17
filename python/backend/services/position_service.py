from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.position import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.entities.position import Position
from shared.repositories.position_repository import PositionRepository
from shared.repositories.preset_repository import PresetRepository
from shared.utils.error import HTTPError, PositionErrorCode, PresetErrorCode
from shared.utils.service import Event, http_service, set_event_response

from ..utils.member import verify_role


@http_service
async def get_positions_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
    event: Event,
) -> list[PositionDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(PresetErrorCode.NotFound)

    position_repo = PositionRepository(session)
    positions = await position_repo.get_all_by_preset_id(preset_id, guild_id)
    response = [PositionDTO.model_validate(p) for p in positions]
    return set_event_response(event, response)


@http_service
async def get_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession,
    event: Event,
) -> PositionDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise HTTPError(PositionErrorCode.NotFound)
    response = PositionDTO.model_validate(position)
    return set_event_response(event, response)


@http_service
async def add_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: AddPositionDTO,
    session: AsyncSession,
    event: Event,
) -> PositionDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(PresetErrorCode.NotFound)

    position = Position(
        preset_id=preset_id,
        name=dto.name,
        icon_url=dto.icon_url,
    )
    session.add(position)
    await session.flush()
    response = PositionDTO.model_validate(position)
    return set_event_response(event, response)


@http_service
async def update_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    session: AsyncSession,
    event: Event,
) -> PositionDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise HTTPError(PositionErrorCode.NotFound)

    for key in dto.model_fields_set:
        setattr(position, key, getattr(dto, key))

    response = PositionDTO.model_validate(position)
    return set_event_response(event, response)


@http_service
async def delete_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession,
    event: Event,
) -> PositionDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise HTTPError(PositionErrorCode.NotFound)

    response = PositionDTO.model_validate(position)
    await session.delete(position)
    return set_event_response(event, response)
