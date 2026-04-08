from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.manager_dto import (
    AddManagerDTO,
    ManagerDetailDTO,
    ManagerDTO,
    UpdateManagerDTO,
)
from shared.entities.manager import Manager, Role
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
async def get_manager_list_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> list[ManagerDetailDTO]:
    await verify_role(guild_id, payload.discord_id, Role.VIEWER, db)

    result = await db.execute(
        select(Manager)
        .options(joinedload(Manager.discord))
        .where(Manager.guild_id == guild_id)
    )
    managers = result.unique().scalars().all()
    return [ManagerDetailDTO.model_validate(m) for m in managers]


@service_exception_handler
async def add_manager_service(
    guild_id: int, dto: AddManagerDTO, db: AsyncSession, payload: Payload
) -> ManagerDTO:
    await verify_role(guild_id, payload.discord_id, Role.ADMIN, db)

    result = await db.execute(
        select(Manager).where(
            Manager.guild_id == guild_id,
            Manager.discord_id == dto.discord_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="User already in guild")

    manager = Manager(
        guild_id=guild_id,
        discord_id=dto.discord_id,
        role=Role.VIEWER,
    )
    db.add(manager)
    await db.commit()
    await db.refresh(manager)
    logger.info(f"Manager added: guild_id={guild_id}, discord_id={dto.discord_id}")
    return ManagerDTO.model_validate(manager)


@service_exception_handler
async def update_manager_service(
    guild_id: int,
    discord_id: str,
    dto: UpdateManagerDTO,
    db: AsyncSession,
    payload: Payload,
) -> ManagerDTO:
    await verify_role(guild_id, payload.discord_id, Role.ADMIN, db)

    result = await db.execute(
        select(Manager).where(
            Manager.guild_id == guild_id,
            Manager.discord_id == discord_id,
        )
    )
    manager = result.scalar_one_or_none()
    if manager is None:
        raise HTTPException(status_code=404, detail="Manager not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(manager, key, value)

    await db.commit()
    await db.refresh(manager)
    logger.info(f"Manager updated: guild_id={guild_id}, discord_id={discord_id}")
    return ManagerDTO.model_validate(manager)


@service_exception_handler
async def remove_manager_service(
    guild_id: int, discord_id: str, db: AsyncSession, payload: Payload
) -> None:
    is_self = discord_id == payload.discord_id

    if not is_self:
        caller_role = await verify_role(guild_id, payload.discord_id, Role.ADMIN, db)
        target_role = await verify_role(guild_id, discord_id, Role.VIEWER, db)
        if caller_role <= target_role:
            raise HTTPException(
                status_code=403,
                detail="Cannot remove user with equal or higher role",
            )

    result = await db.execute(
        select(Manager).where(
            Manager.guild_id == guild_id,
            Manager.discord_id == discord_id,
        )
    )
    manager = result.scalar_one_or_none()
    if manager is None:
        raise HTTPException(status_code=404, detail="Manager not found")

    await db.delete(manager)
    await db.commit()
    logger.info(f"Manager removed: guild_id={guild_id}, discord_id={discord_id}")
