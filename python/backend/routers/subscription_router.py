from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.subscription import (
    BillingDTO,
    CreateSubscriptionDTO,
    RegisterBillingDTO,
    SubscriptionDetailDTO,
    SubscriptionDTO,
)
from shared.utils.db import get_session

from ..services.subscription_service import (
    create_subscription_service,
    delete_billing_service,
    get_subscription_service,
    register_billing_service,
)
from ..utils.token import verify_access_token


subscription_router = APIRouter(
    prefix="/guild/{guild_id}/subscription", tags=["subscription"]
)


@subscription_router.post("", response_model=SubscriptionDTO)
async def create_subscription_route(
    guild_id: int,
    dto: CreateSubscriptionDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await create_subscription_service(guild_id, user_id, dto, session)


@subscription_router.get("", response_model=SubscriptionDetailDTO)
async def get_subscription_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    _: int = Depends(verify_access_token),
):
    return await get_subscription_service(guild_id, session)


@subscription_router.post("/billing", response_model=BillingDTO)
async def register_billing_route(
    guild_id: int,
    dto: RegisterBillingDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await register_billing_service(guild_id, user_id, dto.auth_key, session)


@subscription_router.delete("/billing", status_code=204)
async def delete_billing_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    await delete_billing_service(guild_id, user_id, session)
