import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.val_stat_dto import ValStatDto

from ..services import val_stat_service


logger = logging.getLogger(__name__)

val_stat_router = APIRouter(prefix="/val", tags=["val"])


@val_stat_router.get("/{user_id}", response_model=ValStatDto)
async def get_val_stat_route(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Get: {user_id}")
    return await val_stat_service.get_val_stat(user_id, db)
