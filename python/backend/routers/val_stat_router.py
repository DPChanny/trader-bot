import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.val_stat_dto import ValStatDto

from ..services import val_stat_service


logger = logging.getLogger(__name__)

val_stat_router = APIRouter(prefix="/val", tags=["val"])


@val_stat_router.get("/{user_id}", response_model=ValStatDto)
async def get_val_stat_route(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Get: {user_id}")
    result = await val_stat_service.get_val_stat(user_id, db)

    if result is None:
        logger.warning(f"Not in database: {user_id}")
        raise HTTPException(
            status_code=404,
            detail="VAL info not found. Please wait for crawler to update data.",
        )

    return result
