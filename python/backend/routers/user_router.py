from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.payment import PaymentDetailDTO
from shared.dtos.user import UserDetailDTO
from shared.utils.db import get_session

from ..services.user_service import (
    delete_my_user_service,
    get_my_payments_service,
    get_my_user_service,
)
from ..utils.token import verify_access_token


user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.get("/@me", response_model=UserDetailDTO)
async def get_my_user_route(
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_my_user_service(user_id, session)


@user_router.get("/@me/payment", response_model=list[PaymentDetailDTO])
async def get_my_payments_route(
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    return await get_my_payments_service(user_id, session)


@user_router.delete("/@me", status_code=204)
async def delete_my_user_route(
    session: AsyncSession = Depends(get_session),
    user_id: int = Depends(verify_access_token),
):
    await delete_my_user_service(user_id, session)
