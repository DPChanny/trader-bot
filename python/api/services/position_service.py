from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.position_dto import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.entities.member import Role
from shared.entities.position import Position
from shared.repositories.position_repository import PositionRepository
from shared.repositories.preset_repository import PresetRepository
from shared.utils.error import AppError, PositionErrorCode, PresetErrorCode
from shared.utils.service import service

from ..utils.member import verify_role


@service
async def get_position_list_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
) -> list[PositionDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise AppError(PresetErrorCode.NotFound)

    position_repo = PositionRepository(session)
    positions = await position_repo.get_list_by_preset_id(preset_id, guild_id)
    return [PositionDTO.model_validate(p) for p in positions]


@service
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
        raise AppError(PositionErrorCode.NotFound)
    return PositionDTO.model_validate(position)


@service
async def add_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: AddPositionDTO,
    session: AsyncSession,
    event,
) -> PositionDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise AppError(PresetErrorCode.NotFound)

    position = Position(
        preset_id=preset_id,
        name=dto.name,
        icon_url=dto.icon_url,
    )
    session.add(position)
    await session.flush()
    result = PositionDTO.model_validate(position)
    logger.bind(**result.model_dump())
    return result


@service
async def update_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    session: AsyncSession,
    event,
) -> PositionDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise AppError(PositionErrorCode.NotFound)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(position, key, value)

    result = PositionDTO.model_validate(position)
    logger.bind(**result.model_dump())
    return result


@service
async def delete_position_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession,
    event,
) -> None:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise AppError(PositionErrorCode.NotFound)

    await session.delete(position)
    logger.bind(position_id=position_id)
