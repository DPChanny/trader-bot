from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.position_dto import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.utils.database import get_db

from ..services.position_service import (
    add_position_service,
    delete_position_service,
    update_position_service,
)
from ..utils.token import Payload, verify_token


position_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/position", tags=["position"]
)


@position_router.post("", response_model=PositionDTO)
async def add_position_route(
    guild_id: int,
    preset_id: int,
    dto: AddPositionDTO,
    db: AsyncSession = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await add_position_service(guild_id, preset_id, dto, db, payload)


@position_router.patch("/{position_id}", response_model=PositionDTO)
async def update_position_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    db: AsyncSession = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await update_position_service(
        guild_id, preset_id, position_id, dto, db, payload
    )


@position_router.delete("/{position_id}", status_code=204)
async def delete_position_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    db: AsyncSession = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await delete_position_service(guild_id, preset_id, position_id, db, payload)
