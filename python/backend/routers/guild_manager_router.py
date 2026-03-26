from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.guild_manager_dto import (
    AddGuildManagerDTO,
    GuildManagerDetailDTO,
    GuildManagerDTO,
    UpdateGuildManagerDTO,
)
from shared.utils.database import get_db

from ..services.guild_manager_service import (
    add_guild_manager_service,
    get_guild_manager_list_service,
    remove_guild_manager_service,
    update_guild_manager_service,
)
from ..utils.token import Payload, verify_token


guild_manager_router = APIRouter(
    prefix="/guild/{guild_id}/manager", tags=["guild_manager"]
)


@guild_manager_router.get("", response_model=list[GuildManagerDetailDTO])
def get_guild_manager_list_route(
    guild_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_guild_manager_list_service(guild_id, db, payload)


@guild_manager_router.post("", response_model=GuildManagerDTO)
def add_guild_manager_route(
    guild_id: int,
    dto: AddGuildManagerDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return add_guild_manager_service(guild_id, dto, db, payload)


@guild_manager_router.patch("/{user_id}", response_model=GuildManagerDTO)
def update_guild_manager_route(
    guild_id: int,
    user_id: int,
    dto: UpdateGuildManagerDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return update_guild_manager_service(guild_id, user_id, dto, db, payload)


@guild_manager_router.delete("/{user_id}", status_code=204)
def delete_guild_manager_route(
    guild_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return remove_guild_manager_service(guild_id, user_id, db, payload)
