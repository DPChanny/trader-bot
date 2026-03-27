from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.lol_stat_dto import LolStatDTO
from shared.utils.database import get_async_db

from ..services.lol_stat_service import get_lol_stat
from ..utils.token import Payload, verify_token


lol_stat_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_stat_router.get("/{member_id}", response_model=LolStatDTO)
async def get_lol_stat_route(
    member_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_lol_stat(member_id, db, payload)
