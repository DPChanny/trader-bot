import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.lol_stat_dto import LolStatDto

from ..services import lol_stat_service


logger = logging.getLogger(__name__)

lol_stat_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_stat_router.get("/{user_id}", response_model=LolStatDto)
async def get_lol_stat_route(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Get: {user_id}")
    return await lol_stat_service.get_lol_stat(user_id, db)
