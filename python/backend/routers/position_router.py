from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.position_dto import (
    AddPositionDTO,
    PositionDTO,
    UpdatePositionDTO,
)
from shared.utils.database import get_db

from ..services.position_service import (
    add_position_service,
    delete_position_service,
    get_position_detail_service,
    get_position_list_service,
    update_position_service,
)
from ..utils.token import Payload, verify_token


position_router = APIRouter(
    prefix="/guild/{guild_id}/preset/{preset_id}/position", tags=["position"]
)


@position_router.post("", response_model=PositionDTO)
def add_position_route(
    guild_id: int,
    preset_id: int,
    dto: AddPositionDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return add_position_service(guild_id, preset_id, dto, db, payload)


@position_router.get("", response_model=list[PositionDTO])
def get_position_list_route(
    guild_id: int,
    preset_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_position_list_service(guild_id, preset_id, db, payload)


@position_router.get("/{position_id}", response_model=PositionDTO)
def get_position_detail_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_position_detail_service(guild_id, preset_id, position_id, db, payload)


@position_router.patch("/{position_id}", response_model=PositionDTO)
def update_position_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    dto: UpdatePositionDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return update_position_service(guild_id, preset_id, position_id, dto, db, payload)


@position_router.delete("/{position_id}", status_code=204)
def delete_position_route(
    guild_id: int,
    preset_id: int,
    position_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return delete_position_service(guild_id, preset_id, position_id, db, payload)
