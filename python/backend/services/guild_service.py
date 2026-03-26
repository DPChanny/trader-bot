from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.guild_dto import AddGuildDTO, GuildDetailDTO, GuildDTO, UpdateGuildDTO
from shared.entities.guild import Guild
from shared.entities.manager import Manager, Role
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


async def _query_guild_detail(guild_id: int, db: AsyncSession) -> Guild | None:
    result = await db.execute(
        select(Guild)
        .options(joinedload(Guild.managers).joinedload(Manager.user))
        .where(Guild.guild_id == guild_id)
    )
    return result.unique().scalar_one_or_none()


@service_exception_handler
async def add_guild_service(
    dto: AddGuildDTO, db: AsyncSession, payload: Payload
) -> GuildDetailDTO:
    result = await db.execute(select(Guild).where(Guild.discord_id == dto.discord_id))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Guild already exists")

    guild = Guild(discord_id=dto.discord_id, name=dto.name)
    db.add(guild)
    await db.flush()

    owner = Manager(
        guild_id=guild.guild_id,
        user_id=payload.user_id,
        role=Role.ADMIN,
    )
    db.add(owner)
    await db.commit()

    guild = await _query_guild_detail(guild.guild_id, db)
    logger.info(f"Guild created: id={guild.guild_id}, name={dto.name}")
    return GuildDetailDTO.model_validate(guild)


@service_exception_handler
async def get_guild_list_service(db: AsyncSession, payload: Payload) -> list[GuildDTO]:
    result = await db.execute(
        select(Guild).join(Manager).where(Manager.user_id == payload.user_id)
    )
    guilds = result.unique().scalars().all()
    return [GuildDTO.model_validate(g) for g in guilds]


@service_exception_handler
async def get_guild_detail_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> GuildDetailDTO:
    await verify_role(guild_id, payload.user_id, Role.VIEWER, db)

    guild = await _query_guild_detail(guild_id, db)
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    return GuildDetailDTO.model_validate(guild)


@service_exception_handler
async def update_guild_service(
    guild_id: int, dto: UpdateGuildDTO, db: AsyncSession, payload: Payload
) -> GuildDetailDTO:
    await verify_role(guild_id, payload.user_id, Role.ADMIN, db)

    result = await db.execute(select(Guild).where(Guild.guild_id == guild_id))
    guild = result.scalar_one_or_none()
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(guild, key, value)

    await db.commit()
    logger.info(f"Guild updated: id={guild_id}")

    guild = await _query_guild_detail(guild_id, db)
    return GuildDetailDTO.model_validate(guild)


@service_exception_handler
async def delete_guild_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> None:
    await verify_role(guild_id, payload.user_id, Role.ADMIN, db)

    result = await db.execute(select(Guild).where(Guild.guild_id == guild_id))
    guild = result.scalar_one_or_none()
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    await db.delete(guild)
    await db.commit()
    logger.info(f"Guild deleted: id={guild_id}")
