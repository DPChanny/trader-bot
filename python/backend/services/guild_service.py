from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session, joinedload

from shared.dtos.guild_dto import AddGuildDTO, GuildDetailDTO, GuildDTO, UpdateGuildDTO
from shared.entities.guild import Guild
from shared.entities.guild_manager import GuildManager, GuildRole
from shared.utils.exception import service_exception_handler

from ..utils.role import verify_role
from ..utils.token import Payload


def _query_guild_detail(guild_id: int, db: Session) -> Guild | None:
    return (
        db.query(Guild)
        .options(
            joinedload(Guild.guild_managers).joinedload(GuildManager.manager),
        )
        .filter(Guild.guild_id == guild_id)
        .first()
    )


@service_exception_handler
def add_guild_service(
    dto: AddGuildDTO, db: Session, payload: Payload
) -> GuildDetailDTO:
    existing = db.query(Guild).filter(Guild.discord_id == dto.discord_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Guild already exists")

    guild = Guild(discord_id=dto.discord_id, name=dto.name)
    db.add(guild)
    db.flush()

    owner = GuildManager(
        guild_id=guild.guild_id,
        manager_id=payload.manager_id,
        role=GuildRole.OWNER,
    )
    db.add(owner)
    db.commit()

    guild = _query_guild_detail(guild.guild_id, db)
    logger.info(f"Guild created: id={guild.guild_id}, name={dto.name}")
    return GuildDetailDTO.model_validate(guild)


@service_exception_handler
def get_guild_list_service(db: Session, payload: Payload) -> list[GuildDTO]:
    guilds = (
        db.query(Guild)
        .join(GuildManager)
        .filter(GuildManager.manager_id == payload.manager_id)
        .all()
    )
    return [GuildDTO.model_validate(g) for g in guilds]


@service_exception_handler
def get_guild_detail_service(
    guild_id: int, db: Session, payload: Payload
) -> GuildDetailDTO:
    verify_role(guild_id, payload.manager_id, GuildRole.VIEWER, db)

    guild = _query_guild_detail(guild_id, db)
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    return GuildDetailDTO.model_validate(guild)


@service_exception_handler
def update_guild_service(
    guild_id: int, dto: UpdateGuildDTO, db: Session, payload: Payload
) -> GuildDetailDTO:
    verify_role(guild_id, payload.manager_id, GuildRole.ADMIN, db)

    guild = db.query(Guild).filter(Guild.guild_id == guild_id).first()
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(guild, key, value)

    db.commit()
    logger.info(f"Guild updated: id={guild_id}")

    guild = _query_guild_detail(guild_id, db)
    return GuildDetailDTO.model_validate(guild)


@service_exception_handler
def delete_guild_service(guild_id: int, db: Session, payload: Payload) -> None:
    verify_role(guild_id, payload.manager_id, GuildRole.OWNER, db)

    guild = db.query(Guild).filter(Guild.guild_id == guild_id).first()
    if guild is None:
        raise HTTPException(status_code=404, detail="Guild not found")

    db.delete(guild)
    db.commit()
    logger.info(f"Guild deleted: id={guild_id}")
