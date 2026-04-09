from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from shared.dtos.member_dto import MemberDetailDTO
from shared.entities.member import Member

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import Payload


@service_exception_handler
async def get_member_detail_service(
    guild_id: int, member_id: int, db: AsyncSession, payload: Payload
) -> MemberDetailDTO:
    await verify_role(guild_id, payload.discord_id, db)
    result = await db.execute(
        select(Member)
        .options(selectinload(Member.discord))
        .where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return MemberDetailDTO.model_validate(member)


@service_exception_handler
async def get_member_list_service(
    guild_id: int, db: AsyncSession, payload: Payload
) -> list[MemberDetailDTO]:
    await verify_role(guild_id, payload.discord_id, db)
    result = await db.execute(
        select(Member)
        .options(selectinload(Member.discord))
        .where(Member.guild_id == guild_id)
    )
    members = result.scalars().all()
    return [MemberDetailDTO.model_validate(m) for m in members]


@service_exception_handler
async def update_member_service(
    guild_id: int,
    member_id: int,
    dto,
    db: AsyncSession,
    payload: Payload,
) -> MemberDetailDTO:

    await verify_role(guild_id, payload.discord_id, db)
    result = await db.execute(
        select(Member).where(Member.member_id == member_id, Member.guild_id == guild_id)
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(member, key, value)

    await db.commit()

    result = await db.execute(
        select(Member)
        .options(selectinload(Member.discord))
        .where(Member.member_id == member_id)
    )
    member = result.scalar_one()
    return MemberDetailDTO.model_validate(member)
