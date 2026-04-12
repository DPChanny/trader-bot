from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member_dto import MemberDetailDTO
from shared.entities.member import Role
from shared.error import AppError, Member, service_error_handler
from shared.repositories.member_repository import MemberRepository

from ..utils.member import verify_role


@service_error_handler
async def get_my_member_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> MemberDetailDTO:
    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_user_id(user_id, guild_id)
    if member is None:
        raise AppError(Member.NotFound)
    return MemberDetailDTO.model_validate(member)


@service_error_handler
async def get_member_service(
    guild_id: int, user_id: int, member_id: int, session: AsyncSession
) -> MemberDetailDTO:
    await verify_role(guild_id, user_id, session)
    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_id(member_id, guild_id)
    if member is None:
        raise AppError(Member.NotFound)
    return MemberDetailDTO.model_validate(member)


@service_error_handler
async def get_member_list_service(
    guild_id: int, user_id: int, session: AsyncSession
) -> list[MemberDetailDTO]:
    await verify_role(guild_id, user_id, session)
    member_repo = MemberRepository(session)
    members = await member_repo.get_list_by_guild_id(guild_id)
    return [MemberDetailDTO.model_validate(m) for m in members]


@service_error_handler
async def update_member_service(
    guild_id: int,
    user_id: int,
    member_id: int,
    dto,
    session: AsyncSession,
) -> MemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)
    member_repo = MemberRepository(session)
    member = await member_repo.get_by_id(member_id, guild_id)
    if member is None:
        raise AppError(Member.NotFound)
    if member.role == Role.OWNER or dto.role == Role.OWNER:
        raise AppError(Member.InvalidRole)

    for key, value in dto.model_dump(exclude_unset=True).items():
        setattr(member, key, value)

    member = await member_repo.get_detail_by_id(member_id, guild_id)
    if member is None:
        raise AppError(Member.NotFound)
    result = MemberDetailDTO.model_validate(member)
    logger.bind(**result.model_dump(exclude={"user"})).info("")
    return result
