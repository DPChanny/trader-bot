from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.lol_stat_dto import LolStatDto
from shared.utils.database import get_db

from ..services.lol_stat_service import get_lol_stat
from ..utils.token import Payload, verify_token


lol_stat_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_stat_router.get("/{member_id}", response_model=LolStatDto)
async def get_lol_stat_route(
    member_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await get_lol_stat(member_id, db, payload)
