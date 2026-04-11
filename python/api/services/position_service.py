from fastapi import HTTPException
from loguru import logger
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

from ..utils.exception import service_exception_handler
from ..utils.member import verify_role


@service_exception_handler
async def get_position_list_service(
    guild_id: int,
    discord_id: int,
    preset_id: int,
    session: AsyncSession,
) -> list[PositionDTO]:
    await verify_role(guild_id, discord_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    position_repo = PositionRepository(session)
    positions = await position_repo.get_list_by_preset_id(preset_id, guild_id)
    return [PositionDTO.model_validate(p) for p in positions]


@service_exception_handler
async def get_position_service(
    guild_id: int,
    discord_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession,
) -> PositionDTO:
    await verify_role(guild_id, discord_id, session, Role.VIEWER)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise HTTPException(status_code=404, detail="Position not found")
    return PositionDTO.model_validate(position)


@service_exception_handler
async def add_position_service(
    guild_id: int,
    discord_id: int,
    preset_id: int,
    dto: AddPositionDTO,
    session: AsyncSession,
) -> PositionDTO:
    await verify_role(guild_id, discord_id, session, Role.EDITOR)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPException(status_code=404, detail="Preset not found")

    position_repo = PositionRepository(session)
    position = Position(
        preset_id=preset_id,
        name=dto.name,
        icon_url=dto.icon_url,
    )
    position_repo.add(position)
    await position_repo.commit()
    await position_repo.refresh(position)
    logger.info(f"Position created: id={position.position_id}, name={dto.name}")
    return PositionDTO.model_validate(position)


@service_exception_handler
async def update_position_service(
    guild_id: int,
    discord_id: int,
    preset_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    session: AsyncSession,
) -> PositionDTO:
    await verify_role(guild_id, discord_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise HTTPException(status_code=404, detail="Position not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(position, key, value)

    await position_repo.commit()
    await position_repo.refresh(position)
    logger.info(f"Position updated: id={position_id}")

    return PositionDTO.model_validate(position)


@service_exception_handler
async def delete_position_service(
    guild_id: int,
    discord_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession,
) -> None:
    await verify_role(guild_id, discord_id, session, Role.EDITOR)

    position_repo = PositionRepository(session)
    position = await position_repo.get_by_id(position_id, preset_id, guild_id)
    if position is None:
        raise HTTPException(status_code=404, detail="Position not found")

    await position_repo.delete(position)
    await position_repo.commit()
    logger.info(f"Position deleted: id={position_id}")
