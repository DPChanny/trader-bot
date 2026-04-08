from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.val_stat_dto import ValStatDTO
from shared.utils.database import get_async_db

from ..services.val_stat_service import get_val_stat


val_stat_router = APIRouter(prefix="/val", tags=["val"])


@val_stat_router.get("/{member_id}", response_model=ValStatDTO)
async def get_val_stat_route(
    member_id: int,
    db: AsyncSession = Depends(get_async_db),
):
    return await get_val_stat(member_id, db)
