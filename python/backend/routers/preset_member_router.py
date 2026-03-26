from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_member_dto import (
    AddPresetMemberDTO,
    PresetMemberDetailDTO,
    PresetMemberDTO,
    UpdatePresetMemberDTO,
)
from shared.utils.database import get_async_db

from ..services.preset_member_service import (
    add_preset_member_service,
    delete_preset_member_service,
    get_preset_member_detail_service,
    get_preset_member_list_service,
    update_preset_member_service,
)
from ..utils.token import Payload, verify_token


preset_member_router = APIRouter(
    prefix="/guild/{guild_id}/preset_member",
    tags=["preset_member"],
)


@preset_member_router.post("", response_model=PresetMemberDetailDTO)
async def add_preset_member_route(
    guild_id: int,
    dto: AddPresetMemberDTO,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await add_preset_member_service(guild_id, dto, db, payload)


@preset_member_router.get("", response_model=list[PresetMemberDTO])
async def get_preset_member_list_route(
    guild_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_preset_member_list_service(guild_id, db, payload)


@preset_member_router.get("/{preset_member_id}", response_model=PresetMemberDetailDTO)
async def get_preset_member_detail_route(
    guild_id: int,
    preset_member_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_preset_member_detail_service(
        guild_id, preset_member_id, db, payload
    )


@preset_member_router.patch("/{preset_member_id}", response_model=PresetMemberDetailDTO)
async def update_preset_member_route(
    guild_id: int,
    preset_member_id: int,
    dto: UpdatePresetMemberDTO,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await update_preset_member_service(
        guild_id, preset_member_id, dto, db, payload
    )


@preset_member_router.delete("/{preset_member_id}", status_code=204)
async def delete_preset_member_route(
    guild_id: int,
    preset_member_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await delete_preset_member_service(guild_id, preset_member_id, db, payload)
