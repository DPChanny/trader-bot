from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import MemberDetailDTO, MemberDTO, Role, UpdateMemberDTO
from shared.dtos.page import CursorPageDTO
from shared.repositories.member_repository import MemberRepository
from shared.utils.error import HTTPError, MemberErrorCode
from shared.utils.service import Event, http_service

from ..utils.member import verify_role


@http_service
async def get_my_member_service(
    guild_id: int, user_id: int, session: AsyncSession, event: Event
) -> MemberDetailDTO:
    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_user_id(user_id, guild_id)
    if member is None:
        raise HTTPError(MemberErrorCode.NotFound)
    event.result = MemberDTO.model_validate(member)
    return MemberDetailDTO.model_validate(member)


@http_service
async def get_member_service(
    guild_id: int, user_id: int, member_id: int, session: AsyncSession, event: Event
) -> MemberDetailDTO:
    await verify_role(guild_id, user_id, session)
    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_id(member_id, guild_id)
    if member is None:
        raise HTTPError(MemberErrorCode.NotFound)
    event.result = MemberDTO.model_validate(member)
    return MemberDetailDTO.model_validate(member)


@http_service
async def get_members_service(
    guild_id: int,
    user_id: int,
    session: AsyncSession,
    event: Event,
    search: str | None = None,
    cursor: int | None = None,
) -> CursorPageDTO[MemberDetailDTO]:
    await verify_role(guild_id, user_id, session)
    member_repo = MemberRepository(session)
    members = await member_repo.get_all_by_guild_id(
        guild_id, search=search, cursor=cursor
    )

    response: list[MemberDetailDTO] = []
    event.result = []
    for member in members:
        response.append(MemberDetailDTO.model_validate(member))
        event.result.append(MemberDTO.model_validate(member))

    next_cursor = members[-1].member_id if len(members) == 50 else None
    return CursorPageDTO[MemberDetailDTO](items=response, next_cursor=next_cursor)


@http_service
async def update_member_service(
    guild_id: int,
    user_id: int,
    member_id: int,
    dto: UpdateMemberDTO,
    session: AsyncSession,
    event: Event,
) -> MemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    if "role" in dto.model_fields_set:
        await verify_role(guild_id, user_id, session, Role.ADMIN)

    member_repo = MemberRepository(session)
    member = await member_repo.get_detail_by_id(member_id, guild_id)
    if member is None:
        raise HTTPError(MemberErrorCode.NotFound)

    if "role" in dto.model_fields_set and (
        member.role == Role.OWNER or dto.role == Role.OWNER
    ):
        raise HTTPError(MemberErrorCode.ForbiddenRole)

    for key in dto.model_fields_set:
        setattr(member, key, getattr(dto, key))

    event.result = MemberDTO.model_validate(member)
    return MemberDetailDTO.model_validate(member)
