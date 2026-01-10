import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..dtos.lol_stat_dto import GetLolResponseDTO
from ..services import lol_stat_service
from ..utils.database import get_db

logger = logging.getLogger(__name__)

lol_stat_router = APIRouter(prefix="/lol", tags=["lol"])


@lol_stat_router.get("/{user_id}", response_model=GetLolResponseDTO)
async def get_lol_stat_route(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching LOL: {user_id}")
    result = await lol_stat_service.get_lol_stat(user_id, db)

    if result is None:
        logger.warning(f"Not in database: {user_id}")
        return GetLolResponseDTO(
            success=False,
            code=404,
            message="LOL info not found. Please wait for crawler to update data.",
            data=None,
        )

    return result
