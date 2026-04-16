from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset import (
    CreatePresetDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.utils.database import get_session

from ..services.preset_service import (
    create_preset_service,
    delete_preset_service,
    get_preset_list_service,
    get_preset_service,
    update_preset_service,
)
from ..utils.token import verify_access_token


preset_router = APIRouter(prefix="/guild/{guild_id}/preset", tags=["preset"])


@preset_router.post("", response_model=PresetDTO)
async def create_preset_route(
    guild_id: int,
    dto: CreatePresetDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await create_preset_service(guild_id, user_id, dto, session)


@preset_router.get("", response_model=list[PresetDTO])
async def get_preset_list_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_preset_list_service(guild_id, user_id, session)


@preset_router.get("/{preset_id}", response_model=PresetDTO)
async def get_preset_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_preset_service(guild_id, user_id, preset_id, session)


@preset_router.patch("/{preset_id}", response_model=PresetDTO)
async def update_preset_route(
    guild_id: int,
    preset_id: int,
    dto: UpdatePresetDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await update_preset_service(guild_id, user_id, preset_id, dto, session)


@preset_router.delete("/{preset_id}", status_code=204)
async def delete_preset_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await delete_preset_service(guild_id, user_id, preset_id, session)
