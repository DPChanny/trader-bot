from typing import Any

from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.member_dto import (
    AddMemberDTO,
    MemberDTO,
    UpdateMemberDTO,
)
from shared.entities.guild_manager import GuildRole
from shared.entities.member import Member
from shared.utils.exception import service_exception_handler

from ..utils.bot import get_profile
from ..utils.bucket import delete_profile, upload_profile
from ..utils.role import get_guild_ids, verify_role
from ..utils.token import Payload


async def _upload_profile(bucket: Any, member_id: int, discord_id: str):
    profile = await get_profile(discord_id)
    await upload_profile(bucket, member_id, profile)
    logger.info(f"Profile uploaded: member_id={member_id}")


@service_exception_handler
async def get_member_detail_service(
    member_id: int, db: Session, payload: Payload
) -> MemberDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    member = (
        db.query(Member)
        .filter(Member.member_id == member_id, Member.guild_id.in_(guild_ids))
        .first()
    )

    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    return MemberDTO.model_validate(member)


@service_exception_handler
async def add_member_service(
    dto: AddMemberDTO, db: Session, bucket: Any, payload: Payload
) -> MemberDTO:
    verify_role(dto.guild_id, payload.user_id, GuildRole.EDITOR, db)

    member = Member(
        guild_id=dto.guild_id,
        alias=dto.alias,
        riot_id=dto.riot_id,
        discord_id=dto.discord_id,
    )
    db.add(member)
    db.flush()

    if dto.discord_id is not None:
        await _upload_profile(bucket, member.member_id, dto.discord_id)

    db.commit()
    logger.info(f"Member created: id={member.member_id}, alias={dto.alias}")

    db.refresh(member)
    return MemberDTO.model_validate(member)


@service_exception_handler
async def get_member_list_service(db: Session, payload: Payload) -> list[MemberDTO]:
    guild_ids = get_guild_ids(payload.user_id, db)
    members = db.query(Member).filter(Member.guild_id.in_(guild_ids)).all()
    return [MemberDTO.model_validate(m) for m in members]


@service_exception_handler
async def update_member_service(
    member_id: int, dto: UpdateMemberDTO, db: Session, bucket: Any, payload: Payload
) -> MemberDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    member = (
        db.query(Member)
        .filter(Member.member_id == member_id, Member.guild_id.in_(guild_ids))
        .first()
    )
    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    verify_role(member.guild_id, payload.user_id, GuildRole.EDITOR, db)

    old_discord_id = member.discord_id
    discord_id_changed = False

    for key, value in dto.model_dump(exclude_unset=True).items():
        if key == "discord_id" and value != old_discord_id:
            discord_id_changed = True
        setattr(member, key, value)

    db.flush()

    if discord_id_changed:
        await delete_profile(bucket, member.member_id)
        if member.discord_id is not None:
            await _upload_profile(bucket, member.member_id, member.discord_id)

    db.commit()
    logger.info(f"Member updated: id={member_id}")

    db.refresh(member)
    return MemberDTO.model_validate(member)


@service_exception_handler
async def update_profile_service(
    member_id: int, db: Session, bucket: Any, payload: Payload
) -> MemberDTO:
    guild_ids = get_guild_ids(payload.user_id, db)
    member = (
        db.query(Member)
        .filter(Member.member_id == member_id, Member.guild_id.in_(guild_ids))
        .first()
    )
    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    verify_role(member.guild_id, payload.user_id, GuildRole.EDITOR, db)

    await delete_profile(bucket, member.member_id)
    if member.discord_id is not None:
        await _upload_profile(bucket, member.member_id, member.discord_id)

    logger.info(f"Member profile updated: id={member_id}")
    db.refresh(member)
    return MemberDTO.model_validate(member)


@service_exception_handler
async def delete_member_service(
    member_id: int, db: Session, bucket: Any, payload: Payload
) -> None:
    guild_ids = get_guild_ids(payload.user_id, db)
    member = (
        db.query(Member)
        .filter(Member.member_id == member_id, Member.guild_id.in_(guild_ids))
        .first()
    )
    if member is None:
        logger.warning(f"Member not found: id={member_id}")
        raise HTTPException(status_code=404, detail="Member not found")

    verify_role(member.guild_id, payload.user_id, GuildRole.ADMIN, db)

    db.delete(member)
    db.flush()

    await delete_profile(bucket, member_id)

    db.commit()
    logger.info(f"Member deleted: id={member_id}")
