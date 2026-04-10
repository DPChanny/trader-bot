from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.member_dto import MemberDetailDTO, UpdateMemberDTO
from shared.utils.database import get_session

from ..services.member_service import (
    get_member_detail_service,
    get_member_list_service,
    update_member_service,
)
from ..utils.token import TokenPayload, verify_token


member_router = APIRouter(prefix="/guild/{guild_id}/member", tags=["member"])


@member_router.get("", response_model=list[MemberDetailDTO])
async def get_member_list_route(
    guild_id: int,
    session: AsyncSession = Depends(get_session),
    token_payload: TokenPayload = Depends(verify_token),
):
    return await get_member_list_service(guild_id, session, token_payload)


@member_router.get("/{member_id}", response_model=MemberDetailDTO)
async def get_member_detail_route(
    guild_id: int,
    member_id: int,
    session: AsyncSession = Depends(get_session),
    token_payload: TokenPayload = Depends(verify_token),
):
    return await get_member_detail_service(guild_id, member_id, session, token_payload)


@member_router.patch("/{member_id}", response_model=MemberDetailDTO)
async def update_member_route(
    guild_id: int,
    member_id: int,
    dto: UpdateMemberDTO,
    session: AsyncSession = Depends(get_session),
    token_payload: TokenPayload = Depends(verify_token),
):
    return await update_member_service(guild_id, member_id, dto, session, token_payload)
