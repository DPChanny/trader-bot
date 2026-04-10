from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.lol_stat_dto import LolStatDTO
from shared.utils.database import get_session

from ..services.lol_stat_service import get_lol_stat


lol_stat_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_stat_router.get("/{member_id}", response_model=LolStatDTO)
async def get_lol_stat_route(
    member_id: int,
    session: AsyncSession = Depends(get_session),
):
    return await get_lol_stat(member_id, session)
