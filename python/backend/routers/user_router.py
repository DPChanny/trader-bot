from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user_dto import UserDetailDTO
from shared.utils.database import get_session

from ..services.user_service import delete_me_service, get_me_service
from ..utils.token import TokenPayload, verify_token


user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.get("/@me", response_model=UserDetailDTO)
async def get_me_route(
    session: AsyncSession = Depends(get_session),
    token_payload: TokenPayload = Depends(verify_token),
):
    return await get_me_service(session, token_payload)


@user_router.delete("/@me", status_code=204)
async def delete_me_route(
    session: AsyncSession = Depends(get_session),
    token_payload: TokenPayload = Depends(verify_token),
):
    return await delete_me_service(session, token_payload)
