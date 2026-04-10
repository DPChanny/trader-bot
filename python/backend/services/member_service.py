from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member_dto import MemberDetailDTO
from shared.repositories.member_repository import MemberRepository

from ..utils.exception import service_exception_handler
from ..utils.role import verify_role
from ..utils.token import TokenPayload


@service_exception_handler
async def get_member_detail_service(
    guild_id: int, member_id: int, session: AsyncSession, token_payload: TokenPayload
) -> MemberDetailDTO:
    await verify_role(guild_id, token_payload.discord_id, session)
    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_id(member_id, guild_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")
    return MemberDetailDTO.model_validate(member)


@service_exception_handler
async def get_member_list_service(
    guild_id: int, session: AsyncSession, token_payload: TokenPayload
) -> list[MemberDetailDTO]:
    await verify_role(guild_id, token_payload.discord_id, session)
    member_repo = MemberRepository(session)
    members = await member_repo.get_all_by_guild(guild_id)
    return [MemberDetailDTO.model_validate(m) for m in members]


@service_exception_handler
async def update_member_service(
    guild_id: int,
    member_id: int,
    dto,
    session: AsyncSession,
    token_payload: TokenPayload,
) -> MemberDetailDTO:
    await verify_role(guild_id, token_payload.discord_id, session)
    member_repo = MemberRepository(session)
    member = await member_repo.get_by_id(member_id, guild_id)
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(member, key, value)

    await member_repo.commit()

    member = await member_repo.get_detail_by_id(member_id, guild_id)
    return MemberDetailDTO.model_validate(member)
