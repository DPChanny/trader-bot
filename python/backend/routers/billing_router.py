from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.billing import BillingDTO, RegisterBillingDTO
from shared.utils.db import get_session

from ..services.billing_service import (
    delete_billing_service,
    get_billings_service,
    register_billing_service,
)
from ..utils.token import verify_access_token


billing_router = APIRouter(prefix="/user/@me/billing", tags=["billing"])


@billing_router.get("", response_model=list[BillingDTO])
async def get_billings_route(
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_billings_service(user_id, session)


@billing_router.post("", response_model=BillingDTO)
async def register_billing_route(
    dto: RegisterBillingDTO,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await register_billing_service(user_id, dto.auth_key, session)


@billing_router.delete("/{billing_id}", status_code=204)
async def delete_billing_route(
    billing_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    await delete_billing_service(billing_id, user_id, session)
