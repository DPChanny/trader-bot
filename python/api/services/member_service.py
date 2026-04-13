from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member_dto import MemberDetailDTO, MemberDTO
from shared.entities.member import Role
from shared.repositories.member_repository import MemberRepository
from shared.utils.error import AppError, MemberErrorCode
from shared.utils.service import service

from ..utils.member import verify_role


@service
async def get_my_member_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> MemberDetailDTO:
    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_user_id(user_id, guild_id)
    if member is None:
        raise AppError(MemberErrorCode.NotFound)
    return MemberDetailDTO.model_validate(member)


@service
async def get_member_service(
    guild_id: int, user_id: int, member_id: int, session: AsyncSession
) -> MemberDetailDTO:
    await verify_role(guild_id, user_id, session)
    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_id(member_id, guild_id)
    if member is None:
        raise AppError(MemberErrorCode.NotFound)
    return MemberDetailDTO.model_validate(member)


@service
async def get_member_list_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> list[MemberDetailDTO]:
    await verify_role(guild_id, user_id, session)
    member_repo = MemberRepository(session)
    members = await member_repo.get_list_by_guild_id(guild_id)
    return [MemberDetailDTO.model_validate(m) for m in members]


@service
async def update_member_service(
    guild_id: int,
    user_id: int,
    member_id: int,
    dto,
    session: AsyncSession,
    logger,
) -> MemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)
    member_repo = MemberRepository(session)
    member = await member_repo.get_by_id(member_id, guild_id)
    if member is None:
        raise AppError(MemberErrorCode.NotFound)
    if member.role == Role.OWNER or dto.role == Role.OWNER:
        raise AppError(MemberErrorCode.InvalidRole)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(member, key, value)

    member = await member_repo.get_detail_by_id(member_id, guild_id)
    if member is None:
        raise AppError(MemberErrorCode.NotFound)
    result = MemberDetailDTO.model_validate(member)
    logger.bind(**MemberDTO.model_validate(result).model_dump())
    return result
