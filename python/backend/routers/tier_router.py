from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.tier import (
    AddTierDTO,
    TierDTO,
    UpdateTierDTO,
)
from shared.utils.database import get_session

from ..services.tier_service import (
    add_tier_service,
    delete_tier_service,
    get_tier_service,
    get_tiers_service,
    update_tier_service,
)
from ..utils.token import verify_access_token


tier_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/tier", tags=["tier"]
)


@tier_router.get("", response_model=list[TierDTO])
async def get_tiers_route(
    guild_id: int,
    preset_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_tiers_service(guild_id, user_id, preset_id, session)


@tier_router.get("/{tier_id}", response_model=TierDTO)
async def get_tier_route(
    guild_id: int,
    preset_id: int,
    tier_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_tier_service(guild_id, user_id, preset_id, tier_id, session)


@tier_router.post("", response_model=TierDTO)
async def add_tier_route(
    guild_id: int,
    preset_id: int,
    dto: AddTierDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await add_tier_service(guild_id, user_id, preset_id, dto, session)


@tier_router.patch("/{tier_id}", response_model=TierDTO)
async def update_tier_route(
    guild_id: int,
    preset_id: int,
    tier_id: int,
    dto: UpdateTierDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await update_tier_service(
        guild_id, user_id, preset_id, tier_id, dto, session
    )


@tier_router.delete("/{tier_id}", status_code=204)
async def delete_tier_route(
    guild_id: int,
    preset_id: int,
    tier_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await delete_tier_service(guild_id, user_id, preset_id, tier_id, session)
