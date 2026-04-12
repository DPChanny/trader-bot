from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.position_dto import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.entities.member import Role
from shared.entities.position import Position
from shared.error import AppError, service_error_handler
from shared.error import Position as PositionError
from shared.error import Preset as PresetError
from shared.repositories.position_repository import PositionRepository
from shared.repositories.preset_repository import PresetRepository
from shared.utils.logging import bind_target_func

from ..utils.member import verify_role


@service_error_handler
async def get_position_list_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
) -> list[PositionDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise AppError(PresetError.NotFound)

    position_repo = PositionRepository(session)
    positions = await position_repo.get_list_by_preset_id(preset_id, guild_id)
    return [PositionDTO.model_validate(p) for p in positions]


@service_error_handler
async def get_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession,
) -> PositionDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise AppError(PositionError.NotFound)
    return PositionDTO.model_validate(position)


@service_error_handler
async def add_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: AddPositionDTO,
    session: AsyncSession,
) -> PositionDTO:
    log = bind_target_func(add_position_service)
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise AppError(PresetError.NotFound)

    position = Position(
        preset_id=preset_id,
        name=dto.name,
        icon_url=dto.icon_url,
    )
    session.add(position)
    await session.flush()
    result = PositionDTO.model_validate(position)
    log.bind(**result.model_dump()).info("")
    return result


@service_error_handler
async def update_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    session: AsyncSession,
) -> PositionDTO:
    log = bind_target_func(update_position_service)
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise AppError(PositionError.NotFound)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(position, key, value)

    result = PositionDTO.model_validate(position)
    log.bind(**result.model_dump()).info("")
    return result


@service_error_handler
async def delete_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession,
) -> None:
    log = bind_target_func(delete_position_service)
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise AppError(PositionError.NotFound)

    await session.delete(position)
    log.bind(position_id=position_id).info("")
