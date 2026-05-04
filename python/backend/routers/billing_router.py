from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.billing import BillingDTO, RegisterBillingDTO
from shared.utils.db import get_session

from ..services.billing_service import delete_billing_service, register_billing_service
from ..utils.token import verify_access_token


billing_router = APIRouter(
    prefix="/guild/{guild_id}/subscription/billing", tags=["billing"]
)


@billing_router.post("", response_model=BillingDTO)
async def register_billing_route(
    guild_id: int,
    dto: RegisterBillingDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await register_billing_service(guild_id, user_id, dto.auth_key, session)


@billing_router.delete("", status_code=204)
async def delete_billing_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    await delete_billing_service(guild_id, user_id, session)
