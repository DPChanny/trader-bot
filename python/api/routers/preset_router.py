from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.preset_dto import (
    AddPresetDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.utils.database import get_session

from ..services.preset_service import (
    add_preset_service,
    delete_preset_service,
    get_preset_list_service,
    get_preset_service,
    update_preset_service,
)
from ..utils.token import verify_token


preset_router = APIRouter(prefix="/guild/{guild_id}/preset", tags=["preset"])


@preset_router.post("", response_model=PresetDTO)
async def add_preset_route(
    guild_id: int,
    dto: AddPresetDTO,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await add_preset_service(guild_id, discord_id, dto, session)


@preset_router.get("", response_model=list[PresetDTO])
async def get_preset_list_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await get_preset_list_service(guild_id, discord_id, session)


@preset_router.get("/{preset_id}", response_model=PresetDTO)
async def get_preset_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await get_preset_service(guild_id, discord_id, preset_id, session)


@preset_router.patch("/{preset_id}", response_model=PresetDTO)
async def update_preset_route(
    guild_id: int,
    preset_id: int,
    dto: UpdatePresetDTO,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await update_preset_service(guild_id, discord_id, preset_id, dto, session)


@preset_router.delete("/{preset_id}", status_code=204)
async def delete_preset_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_token),
):
    return await delete_preset_service(guild_id, discord_id, preset_id, session)
