from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.subscription import RegisterSubscriptionDTO, SubscriptionDTO
from shared.utils.db import get_session

from ..services.subscription_service import (
    get_subscription_service,
    register_subscription_service,
)
from ..utils.token import verify_access_token


subscription_router = APIRouter(
    prefix="/guild/{guild_id}/subscription", tags=["subscription"]
)


@subscription_router.post("", response_model=SubscriptionDTO)
async def register_subscription_route(
    guild_id: int,
    dto: RegisterSubscriptionDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await register_subscription_service(guild_id, user_id, dto, session)


@subscription_router.get("", response_model=SubscriptionDTO)
async def get_subscription_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    _: int = Depends(verify_access_token),
):
    return await get_subscription_service(guild_id, session)
