from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.subscription import CreateSubscriptionDTO, SubscriptionDTO
from shared.utils.db import get_session

from ..services.subscription_service import create_subscription_service
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
