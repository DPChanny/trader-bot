from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.manager_dto import (
    AddManagerDTO,
    ManagerDetailDTO,
    ManagerDTO,
    UpdateManagerDTO,
)
from shared.utils.database import get_async_db

from ..services.manager_service import (
    add_manager_service,
    get_manager_list_service,
    remove_manager_service,
    update_manager_service,
)
from ..utils.token import Payload, verify_token


manager_router = APIRouter(prefix="/guild/{guild_id}/manager", tags=["manager"])


@manager_router.get("", response_model=list[ManagerDetailDTO])
async def get_manager_list_route(
    guild_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_manager_list_service(guild_id, db, payload)


@manager_router.post("", response_model=ManagerDTO)
async def add_manager_route(
    guild_id: int,
    dto: AddManagerDTO,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await add_manager_service(guild_id, dto, db, payload)


@manager_router.patch("/{user_id}", response_model=ManagerDTO)
async def update_manager_route(
    guild_id: int,
    user_id: int,
    dto: UpdateManagerDTO,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await update_manager_service(guild_id, user_id, dto, db, payload)


@manager_router.delete("/{user_id}", status_code=204)
async def delete_manager_route(
    guild_id: int,
    user_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await remove_manager_service(guild_id, user_id, db, payload)
