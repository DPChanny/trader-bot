from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.position_dto import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.utils.database import get_session

from ..services.position_service import (
    add_position_service,
    delete_position_service,
    get_position_list_service,
    get_position_service,
    update_position_service,
)
from ..utils.token import verify_access_token


position_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/position", tags=["position"]
)


@position_router.get("", response_model=list[PositionDTO])
async def get_position_list_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_access_token),
):
    return await get_position_list_service(guild_id, discord_id, preset_id, session)


@position_router.get("/{position_id}", response_model=PositionDTO)
async def get_position_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_access_token),
):
    return await get_position_service(
        guild_id, discord_id, preset_id, position_id, session
    )


@position_router.post("", response_model=PositionDTO)
async def add_position_route(
    guild_id: int,
    preset_id: int,
    dto: AddPositionDTO,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_access_token),
):
    return await add_position_service(guild_id, discord_id, preset_id, dto, session)


@position_router.patch("/{position_id}", response_model=PositionDTO)
async def update_position_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_access_token),
):
    return await update_position_service(
        guild_id, discord_id, preset_id, position_id, dto, session
    )


@position_router.delete("/{position_id}", status_code=204)
async def delete_position_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    session: AsyncSession = Depends(get_session),
    discord_id: int = Depends(verify_access_token),
):
    return await delete_position_service(
        guild_id, discord_id, preset_id, position_id, session
    )
