from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_member_dto import (
    AddPresetMemberDTO,
    PresetMemberDetailDTO,
    UpdatePresetMemberDTO,
)
from shared.utils.database import get_session

from ..services.preset_member_service import (
    add_preset_member_service,
    delete_preset_member_service,
    get_preset_member_service,
    get_preset_member_list_service,
    update_preset_member_service,
)
from ..utils.token import verify_token


preset_member_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/member",
    tags=["preset_member"],
)


@preset_member_router.get("", response_model=list[PresetMemberDetailDTO])
async def get_preset_member_list_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await get_preset_member_list_service(
        guild_id, discord_id, preset_id, session
    )


@preset_member_router.get("/{preset_member_id}", response_model=PresetMemberDetailDTO)
async def get_preset_member_route(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await get_preset_member_service(
        guild_id, discord_id, preset_id, preset_member_id, session
    )


@preset_member_router.post("", response_model=PresetMemberDetailDTO)
async def add_preset_member_route(
    guild_id: int,
    preset_id: int,
    dto: AddPresetMemberDTO,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await add_preset_member_service(
        guild_id, discord_id, preset_id, dto, session
    )


@preset_member_router.patch("/{preset_member_id}", response_model=PresetMemberDetailDTO)
async def update_preset_member_route(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    dto: UpdatePresetMemberDTO,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await update_preset_member_service(
        guild_id, discord_id, preset_id, preset_member_id, dto, session
    )


@preset_member_router.delete("/{preset_member_id}", status_code=204)
async def delete_preset_member_route(
    guild_id: int,
    preset_id: int,
    preset_member_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await delete_preset_member_service(
        guild_id, discord_id, preset_id, preset_member_id, session
    )
