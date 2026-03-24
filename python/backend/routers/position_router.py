from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.position_dto import (
    AddPositionRequestDTO,
    PositionDTO,
    UpdatePositionRequestDTO,
)

from ..services.position_service import (
    add_position_service,
    delete_position_service,
    get_position_detail_service,
    get_position_list_service,
    update_position_service,
)
from ..utils.auth import verify_admin_token


position_router = APIRouter(prefix="/position", tags=["position"])


@position_router.post("", response_model=PositionDTO)
def add_position_route(
    dto: AddPositionRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    return add_position_service(dto, db)


@position_router.get("", response_model=list[PositionDTO])
def get_position_list_route(db: Session = Depends(get_db)):
    return get_position_list_service(db)


@position_router.get("/{position_id}", response_model=PositionDTO)
def get_position_detail_route(position_id: int, db: Session = Depends(get_db)):
    return get_position_detail_service(position_id, db)


@position_router.patch("/{position_id}", response_model=PositionDTO)
def update_position_route(
    position_id: int,
    dto: UpdatePositionRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    return update_position_service(position_id, dto, db)


@position_router.delete("/{position_id}", status_code=204)
def delete_position_route(
    position_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    delete_position_service(position_id, db)
    return Response(status_code=204)
