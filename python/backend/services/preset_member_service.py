from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member import Role
from shared.dtos.preset_member import (
    AddPresetMemberDTO,
    PresetMemberDetailDTO,
    UpdatePresetMemberDTO,
)
from shared.entities.preset_member import PresetMember
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
from shared.utils.service import http_service

from ..utils.member import verify_role


@http_service
async def get_preset_member_list_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
) -> list[PresetMemberDetailDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise HTTPError(PresetErrorCode.NotFound)

    preset_member_repo = PresetMemberRepository(session)
    members = await preset_member_repo.get_list_detail_by_preset_id(preset_id, guild_id)
    return [PresetMemberDetailDTO.model_validate(m) for m in members]


@http_service
async def get_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    session: AsyncSession,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise HTTPError(PresetMemberErrorCode.NotFound)
    return PresetMemberDetailDTO.model_validate(preset_member)


@http_service
async def add_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    dto: AddPresetMemberDTO,
    session: AsyncSession,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

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
    return PresetMemberDetailDTO.model_validate(preset_member)


@http_service
async def update_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    dto: UpdatePresetMemberDTO,
    session: AsyncSession,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = await preset_member_repo.get_by_id(
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

    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member_id, preset_id, guild_id
    )
    return PresetMemberDetailDTO.model_validate(preset_member)


@http_service
async def delete_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    session: AsyncSession,
) -> PresetMemberDetailDTO:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = await preset_member_repo.get_by_id(
        preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise HTTPError(PresetMemberErrorCode.NotFound)

    preset_member_detail = await preset_member_repo.get_detail_by_id(
        preset_member_id, preset_id, guild_id
    )
    if preset_member_detail is None:
        raise HTTPError(PresetMemberErrorCode.NotFound)

    response = PresetMemberDetailDTO.model_validate(preset_member_detail)
    await session.delete(preset_member)
    return response
