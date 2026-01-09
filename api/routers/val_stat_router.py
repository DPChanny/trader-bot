import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from dtos.val_stat_dto import GetValResponseDTO
from services import val_stat_service
from utils.database import get_db

logger = logging.getLogger(__name__)

val_stat_router = APIRouter(prefix="/val", tags=["val"])


@val_stat_router.get("/{user_id}", response_model=GetValResponseDTO)
async def get_val_stat_route(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching VAL: {user_id}")
    result = await val_stat_service.get_val_stat(user_id, db)

    if result is None:
        logger.warning(f"Not in database: {user_id}")
        return GetValResponseDTO(
            success=False,
            code=404,
            message="VAL info not found. Please wait for crawler to update data.",
            data=None,
        )

    return result
