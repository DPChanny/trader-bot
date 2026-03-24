from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.tier_dto import (
    AddTierRequestDTO,
    TierDTO,
    UpdateTierRequestDTO,
)

from ..services.tier_service import (
    add_tier_service,
    delete_tier_service,
    get_tier_detail_service,
    get_tier_list_service,
    update_tier_service,
)
from ..utils.auth import verify_admin_token


tier_router = APIRouter(prefix="/tier", tags=["tier"])


@tier_router.post("", response_model=TierDTO)
def add_tier_route(
    dto: AddTierRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    return add_tier_service(dto, db)


@tier_router.get("", response_model=list[TierDTO])
def get_tier_list_route(db: Session = Depends(get_db)):
    return get_tier_list_service(db)


@tier_router.get("/{tier_id}", response_model=TierDTO)
def get_tier_detail_route(tier_id: int, db: Session = Depends(get_db)):
    return get_tier_detail_service(tier_id, db)


@tier_router.patch("/{tier_id}", response_model=TierDTO)
def update_tier_route(
    tier_id: int,
    dto: UpdateTierRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    return update_tier_service(tier_id, dto, db)


@tier_router.delete("/{tier_id}", status_code=204)
def delete_tier_route(
    tier_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    delete_tier_service(tier_id, db)
    return Response(status_code=204)
