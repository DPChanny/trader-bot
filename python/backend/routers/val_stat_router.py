from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.val_stat_dto import ValStatDto
from shared.utils.database import get_db

from ..services.val_stat_service import get_val_stat


val_stat_router = APIRouter(prefix="/val", tags=["val"])


@val_stat_router.get("/{user_id}", response_model=ValStatDto)
async def get_val_stat_route(user_id: int, db: Session = Depends(get_db)):
    return await get_val_stat(user_id, db)
