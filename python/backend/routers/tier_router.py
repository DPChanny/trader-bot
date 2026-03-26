from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.tier_dto import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.utils.database import get_async_db

from ..services.tier_service import (
    add_tier_service,
    delete_tier_service,
    get_tier_detail_service,
    get_tier_list_service,
    update_tier_service,
)
from ..utils.token import Payload, verify_token


tier_router = APIRouter(prefix="/guild/{guild_id}/tier", tags=["tier"])


@tier_router.post("", response_model=TierDTO)
async def add_tier_route(
    guild_id: int,
    dto: AddTierDTO,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await add_tier_service(guild_id, dto, db, payload)


@tier_router.get("", response_model=list[TierDTO])
async def get_tier_list_route(
    guild_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_tier_list_service(guild_id, db, payload)


@tier_router.get("/{tier_id}", response_model=TierDTO)
async def get_tier_detail_route(
    guild_id: int,
    tier_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_tier_detail_service(guild_id, tier_id, db, payload)


@tier_router.patch("/{tier_id}", response_model=TierDTO)
async def update_tier_route(
    guild_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await update_tier_service(guild_id, tier_id, dto, db, payload)


@tier_router.delete("/{tier_id}", status_code=204)
async def delete_tier_route(
    guild_id: int,
    tier_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await delete_tier_service(guild_id, tier_id, db, payload)
