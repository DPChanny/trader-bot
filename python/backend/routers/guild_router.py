from fastapi import APIRouter, Depends, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.guild_dto import (
    GuildDetailDTO,
    GuildDTO,
    InviteUrlDTO,
    UpdateGuildDTO,
)
from shared.utils.database import get_async_db

from ..services.guild_service import (
    add_guild_callback_service,
    add_guild_service,
    delete_guild_service,
    get_guild_detail_service,
    get_guild_list_service,
    update_guild_service,
)
from ..utils.token import Payload, verify_token


guild_router = APIRouter(prefix="/guild", tags=["guild"])


@guild_router.get("", response_model=list[GuildDTO])
async def get_guild_list_route(
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_guild_list_service(db, payload)


@guild_router.get("/{guild_id}", response_model=GuildDetailDTO)
async def get_guild_detail_route(
    guild_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await get_guild_detail_service(guild_id, db, payload)


@guild_router.patch("/{guild_id}", response_model=GuildDetailDTO)
async def update_guild_route(
    guild_id: int,
    dto: UpdateGuildDTO,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await update_guild_service(guild_id, dto, db, payload)


@guild_router.delete("/{guild_id}", status_code=204)
async def delete_guild_route(
    guild_id: int,
    db: AsyncSession = Depends(get_async_db),
    payload: Payload = Depends(verify_token),
):
    return await delete_guild_service(guild_id, db, payload)


@guild_router.post("", response_model=InviteUrlDTO)
async def add_guild_route(
    payload: Payload = Depends(verify_token),
):
    return await add_guild_service(payload)


@guild_router.get("/callback")
async def add_guild_callback_route(
    guild_id: str = Query(),
    state: str = Query(),
    db: AsyncSession = Depends(get_async_db),
) -> RedirectResponse:
    return await add_guild_callback_service(guild_id, state, db)
