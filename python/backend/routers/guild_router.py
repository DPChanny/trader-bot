from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.guild_dto import AddGuildDTO, GuildDetailDTO, GuildDTO, UpdateGuildDTO
from shared.utils.database import get_db

from ..services.guild_service import (
    add_guild_service,
    delete_guild_service,
    get_guild_detail_service,
    get_guild_list_service,
    update_guild_service,
)
from ..utils.token import Payload, verify_token


guild_router = APIRouter(prefix="/guild", tags=["guild"])


@guild_router.post("", response_model=GuildDetailDTO)
def add_guild_route(
    dto: AddGuildDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return add_guild_service(dto, db, payload)


@guild_router.get("", response_model=list[GuildDTO])
def get_guild_list_route(
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_guild_list_service(db, payload)


@guild_router.get("/{guild_id}", response_model=GuildDetailDTO)
def get_guild_detail_route(
    guild_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_guild_detail_service(guild_id, db, payload)


@guild_router.patch("/{guild_id}", response_model=GuildDetailDTO)
def update_guild_route(
    guild_id: int,
    dto: UpdateGuildDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return update_guild_service(guild_id, dto, db, payload)


@guild_router.delete("/{guild_id}", status_code=204)
def delete_guild_route(
    guild_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return delete_guild_service(guild_id, db, payload)
