from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.page import CursorPageDTO
from shared.dtos.preset_member import (
    AddPresetMemberDTO,
    PresetMemberDetailDTO,
    PresetMemberDTO,
    UpdatePresetMemberDTO,
)
from shared.entities import PresetMember
from shared.repositories.member_repository import MemberRepository
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.repositories.preset_repository import PresetRepository
from shared.repositories.tier_repository import TierRepository
from shared.utils.error import (
    HTTPError,
    MemberErrorCode,
    PresetErrorCode,
    PresetMemberErrorCode,
    TierErrorCode,
)
from shared.utils.service import Event, http_service

from ..utils.member import verify_role


@http_service
async def get_preset_members_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
    event: Event,
    search: str | None = None,
    cursor: int | None = None,
) -> CursorPageDTO[PresetMemberDetailDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(PresetErrorCode.NotFound)

    preset_member_repo = PresetMemberRepository(session)
    members = await preset_member_repo.get_all_detail_by_preset_id(
        preset_id, guild_id, search=search, cursor=cursor
    )

    response: list[PresetMemberDetailDTO] = []
    event.result = []
    for member in members:
        response.append(PresetMemberDetailDTO.model_validate(member))
        event.result.append(PresetMemberDTO.model_validate(member))

    next_cursor = members[-1].preset_member_id if len(members) == 50 else None
    return CursorPageDTO[PresetMemberDetailDTO](items=response, next_cursor=next_cursor)


@http_service
async def get_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    session: AsyncSession,
    event: Event,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise HTTPError(PresetMemberErrorCode.NotFound)
    event.result = PresetMemberDTO.model_validate(preset_member)
    return PresetMemberDetailDTO.model_validate(preset_member)


@http_service
async def add_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: AddPresetMemberDTO,
    session: AsyncSession,
    event: Event,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    member_repo = MemberRepository(session)
    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(PresetErrorCode.NotFound)

    if await member_repo.get_by_id(dto.member_id, guild_id) is None:
        raise HTTPError(MemberErrorCode.NotFound)

    if dto.tier_id is not None:
        tier_repo = TierRepository(session)
        if await tier_repo.get_by_id(dto.tier_id, preset_id, guild_id) is None:
            raise HTTPError(TierErrorCode.NotFound)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = PresetMember(
        preset_id=preset_id,
        member_id=dto.member_id,
        tier_id=dto.tier_id,
        is_leader=dto.is_leader,
        info_url=dto.info_url,
    )
    session.add(preset_member)
    await session.flush()

    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member.preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise HTTPError(PresetMemberErrorCode.NotFound)
    event.result = PresetMemberDTO.model_validate(preset_member)
    return PresetMemberDetailDTO.model_validate(preset_member)


@http_service
async def update_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    dto: UpdatePresetMemberDTO,
    session: AsyncSession,
    event: Event,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise HTTPError(PresetMemberErrorCode.NotFound)

    tier_repo = TierRepository(session)
    for key in dto.model_fields_set:
        value = getattr(dto, key)
        if key == "tier_id" and value is not None:
            tier = await tier_repo.get_by_id(value, preset_id, guild_id)
            if tier is None:
                raise HTTPError(TierErrorCode.NotFound)
        setattr(preset_member, key, value)

    event.result = PresetMemberDTO.model_validate(preset_member)
    return PresetMemberDetailDTO.model_validate(preset_member)


@http_service
async def delete_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    session: AsyncSession,
    event: Event,
) -> None:
    await verify_role(guild_id, user_id, session, Role.ADMIN)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise HTTPError(PresetMemberErrorCode.NotFound)

    event.result = PresetMemberDTO.model_validate(preset_member)
    await session.delete(preset_member)
