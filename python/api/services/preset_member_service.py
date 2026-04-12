from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_member_dto import (
    AddPresetMemberDTO,
    PresetMemberDetailDTO,
    UpdatePresetMemberDTO,
)
from shared.entities.member import Role
from shared.entities.preset_member import PresetMember
from shared.error import (
    AppError,
    Member,
    service_error_handler,
)
from shared.error import (
    Preset as PresetError,
)
from shared.error import (
    PresetMember as PresetMemberError,
)
from shared.error import (
    Tier as TierError,
)
from shared.repositories.member_repository import MemberRepository
from shared.repositories.preset_member_repository import PresetMemberRepository
from shared.repositories.preset_repository import PresetRepository
from shared.repositories.tier_repository import TierRepository

from ..utils.member import verify_role


@service_error_handler
async def get_preset_member_list_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    session: AsyncSession,
) -> list[PresetMemberDetailDTO]:
    await verify_role(guild_id, user_id, session, Role.VIEWER)

    preset_repo = PresetRepository(session)
    if await preset_repo.get_by_id(preset_id, guild_id) is None:
        raise AppError(PresetError.NotFound)

    preset_member_repo = PresetMemberRepository(session)
    members = await preset_member_repo.get_list_detail_by_preset_id(preset_id, guild_id)
    return [PresetMemberDetailDTO.model_validate(m) for m in members]


@service_error_handler
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
        raise AppError(PresetMemberError.NotFound)
    return PresetMemberDetailDTO.model_validate(preset_member)


@service_error_handler
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
        raise AppError(PresetError.NotFound)

    if await member_repo.get_by_id(dto.member_id, guild_id) is None:
        raise AppError(Member.NotFound)

    if dto.tier_id is not None:
        tier_repo = TierRepository(session)
        if await tier_repo.get_by_id(dto.tier_id, preset_id, guild_id) is None:
            raise AppError(TierError.NotFound)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = PresetMember(
        preset_id=preset_id,
        member_id=dto.member_id,
        tier_id=dto.tier_id,
        is_leader=dto.is_leader,
    )
    session.add(preset_member)
    await session.flush()

    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member.preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise AppError(PresetMemberError.NotFound)
    result = PresetMemberDetailDTO.model_validate(preset_member)
    logger.bind(
        **result.model_dump(exclude={"member", "tier", "preset_member_positions"})
    ).info("")
    return result


@service_error_handler
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
        raise AppError(PresetMemberError.NotFound)

    tier_repo = TierRepository(session)
    for key, value in dto.model_dump(exclude_unset=True).items():
        if key == "tier_id" and value is not None:
            tier = await tier_repo.get_by_id(value, preset_id, guild_id)
            if tier is None:
                raise AppError(TierError.NotFound)
        setattr(preset_member, key, value)

    preset_member = await preset_member_repo.get_detail_by_id(
        preset_member_id, preset_id, guild_id
    )
    result = PresetMemberDetailDTO.model_validate(preset_member)
    logger.bind(
        **result.model_dump(exclude={"member", "tier", "preset_member_positions"})
    ).info("")
    return result


@service_error_handler
async def delete_preset_member_service(
    guild_id: int,
    user_id: int,
    preset_id: int,
    preset_member_id: int,
    session: AsyncSession,
) -> None:
    await verify_role(guild_id, user_id, session, Role.EDITOR)

    preset_member_repo = PresetMemberRepository(session)
    preset_member = await preset_member_repo.get_by_id(
        preset_member_id, preset_id, guild_id
    )
    if preset_member is None:
        raise AppError(PresetMemberError.NotFound)

    await session.delete(preset_member)
    logger.bind(preset_member_id=preset_member_id).info("")
