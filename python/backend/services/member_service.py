from typing import Any

from fastapi import HTTPException
from loguru import logger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member_dto import (
    AddMemberDTO,
    MemberDTO,
    UpdateMemberDTO,
)
from shared.entities.manager import Role
from shared.entities.member import Member
from shared.utils.exception import service_exception_handler

from ..utils.bot import get_profile
from ..utils.bucket import delete_profile, upload_profile
from ..utils.role import verify_role
from ..utils.token import Payload


async def _upload_profile(bucket: Any, member_id: int, discord_id: str):
    profile = await get_profile(discord_id)
    await upload_profile(bucket, member_id, profile)
    logger.info(f"Profile uploaded: member_id={member_id}")


@service_exception_handler
async def get_member_detail_service(
    guild_id: int, member_id: int, db: AsyncSession, payload: Payload
) -> MemberDTO:
    await verify_role(guild_id, payload.user_id, Role.VIEWER, db)
    result = await db.execute(
        select(Member).where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()

    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    return MemberDTO.model_validate(member)


@service_exception_handler
async def add_member_service(
    guild_id: int, dto: AddMemberDTO, db: AsyncSession, bucket: Any, payload: Payload
) -> MemberDTO:
    await verify_role(guild_id, payload.user_id, Role.EDITOR, db)

    member = Member(
        guild_id=guild_id,
        alias=dto.alias,
        riot_id=dto.riot_id,
        discord_id=dto.discord_id,
    )
    db.add(member)
    await db.flush()

    if dto.discord_id is not None:
        await _upload_profile(bucket, member.member_id, dto.discord_id)

    await db.commit()
    logger.info(f"Member created: id={member.member_id}, alias={dto.alias}")

    await db.refresh(member)
    return MemberDTO.model_validate(member)


@service_exception_handler
async def get_member_list_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> list[MemberDTO]:
    await verify_role(guild_id, payload.user_id, Role.VIEWER, db)
    result = await db.execute(select(Member).where(Member.guild_id == guild_id))
    members = result.scalars().all()
    return [MemberDTO.model_validate(m) for m in members]


@service_exception_handler
async def update_member_service(
    guild_id: int,
    member_id: int,
    dto: UpdateMemberDTO,
    db: AsyncSession,
    bucket: Any,
    payload: Payload,
) -> MemberDTO:
    await verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    result = await db.execute(
        select(Member).where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    old_discord_id = member.discord_id
    discord_id_changed = False

    for key, value in dto.model_dump(exclude_unset=True).items():
        if key == "discord_id" and value != old_discord_id:
            discord_id_changed = True
        setattr(member, key, value)

    await db.flush()

    if discord_id_changed:
        await delete_profile(bucket, member.member_id)
        if member.discord_id is not None:
            await _upload_profile(bucket, member.member_id, member.discord_id)

    await db.commit()
    logger.info(f"Member updated: id={member_id}")

    await db.refresh(member)
    return MemberDTO.model_validate(member)


@service_exception_handler
async def update_profile_service(
    guild_id: int, member_id: int, db: AsyncSession, bucket: Any, payload: Payload
) -> MemberDTO:
    await verify_role(guild_id, payload.user_id, Role.EDITOR, db)
    result = await db.execute(
        select(Member).where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    await delete_profile(bucket, member.member_id)
    if member.discord_id is not None:
        await _upload_profile(bucket, member.member_id, member.discord_id)

    logger.info(f"Member profile updated: id={member_id}")
    await db.refresh(member)
    return MemberDTO.model_validate(member)


@service_exception_handler
async def delete_member_service(
    guild_id: int, member_id: int, db: AsyncSession, bucket: Any, payload: Payload
) -> None:
    await verify_role(guild_id, payload.user_id, Role.ADMIN, db)
    result = await db.execute(
        select(Member).where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)
    await db.flush()

    await delete_profile(bucket, member_id)

    await db.commit()
    logger.info(f"Member deleted: id={member_id}")
