from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.payment import PaymentDTO
from shared.utils.db import get_session

from ..services.payment_service import get_guild_payments_service
from ..utils.token import verify_access_token


payment_router = APIRouter(
    prefix="/guild/{guild_id}/subscription/payment", tags=["payment"]
)


@payment_router.get("", response_model=list[PaymentDTO])
async def get_guild_payments_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_guild_payments_service(guild_id, user_id, session)
