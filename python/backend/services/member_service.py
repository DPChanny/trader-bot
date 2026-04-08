from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from shared.dtos.member_dto import (
    AddMemberDTO,
    MemberDetailDTO,
    UpdateMemberDTO,
)
from shared.entities.guild import Guild
from shared.entities.manager import Role
from shared.entities.member import Member
from shared.utils.exception import service_exception_handler

from ..utils.discord import verify_member
from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
async def get_member_detail_service(
    guild_id: int, member_id: int, db: AsyncSession, payload: Payload
) -> MemberDetailDTO:
    await verify_role(guild_id, payload.discord_id, Role.VIEWER, db)
    result = await db.execute(
        select(Member)
        .options(joinedload(Member.discord))
        .where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()

    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    return MemberDetailDTO.model_validate(member)


@service_exception_handler
async def add_member_service(
    guild_id: int, dto: AddMemberDTO, db: AsyncSession, payload: Payload
) -> MemberDetailDTO:
    await verify_role(guild_id, payload.discord_id, Role.EDITOR, db)

    if dto.discord_id is not None:
        guild_result = await db.execute(select(Guild).where(Guild.guild_id == guild_id))
        guild = guild_result.scalar_one_or_none()
        if guild is None:
            raise HTTPException(status_code=404, detail="Guild not found")
        await verify_member(guild.discord_id, dto.discord_id)

    member = Member(
        guild_id=guild_id,
        riot_id=dto.riot_id,
        discord_id=dto.discord_id,
    )
    db.add(member)
    await db.flush()
    await db.commit()
    logger.info(f"Member created: id={member.member_id}")

    result = await db.execute(
        select(Member)
        .options(joinedload(Member.discord))
        .where(Member.member_id == member.member_id)
    )
    member = result.scalar_one()
    return MemberDetailDTO.model_validate(member)


@service_exception_handler
async def get_member_list_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> list[MemberDetailDTO]:
    await verify_role(guild_id, payload.discord_id, Role.VIEWER, db)
    result = await db.execute(
        select(Member)
        .options(joinedload(Member.discord))
        .where(Member.guild_id == guild_id)
    )
    members = result.unique().scalars().all()
    return [MemberDetailDTO.model_validate(m) for m in members]


@service_exception_handler
async def update_member_service(
    guild_id: int,
    member_id: int,
    dto: UpdateMemberDTO,
    db: AsyncSession,
    payload: Payload,
) -> MemberDetailDTO:
    await verify_role(guild_id, payload.discord_id, Role.EDITOR, db)
    result = await db.execute(
        select(Member).where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    old_discord_id = member.discord_id
    new_discord_id = dto.model_dump(exclude_unset=True).get(
        "discord_id", old_discord_id
    )

    if new_discord_id is not None and new_discord_id != old_discord_id:
        guild_result = await db.execute(select(Guild).where(Guild.guild_id == guild_id))
        guild = guild_result.scalar_one_or_none()
        if guild is None:
            raise HTTPException(status_code=404, detail="Guild not found")
        await verify_member(guild.discord_id, new_discord_id)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(member, key, value)

    await db.commit()
    logger.info(f"Member updated: id={member_id}")

    result = await db.execute(
        select(Member)
        .options(joinedload(Member.discord))
        .where(Member.member_id == member_id)
    )
    member = result.scalar_one()
    return MemberDetailDTO.model_validate(member)


@service_exception_handler
async def delete_member_service(
    guild_id: int, member_id: int, db: AsyncSession, payload: Payload
) -> None:
    await verify_role(guild_id, payload.discord_id, Role.ADMIN, db)
    result = await db.execute(
        select(Member).where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    await db.commit()
    logger.info(f"Member deleted: id={member_id}")
