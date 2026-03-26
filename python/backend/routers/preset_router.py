from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.preset_dto import (
    AddPresetDTO,
    PresetDetailDTO,
    PresetDTO,
    UpdatePresetDTO,
)
from shared.utils.database import get_db

from ..services.preset_service import (
    add_preset_service,
    delete_preset_service,
    get_preset_detail_service,
    get_preset_list_service,
    update_preset_service,
)
from ..utils.auth import verify_token


preset_router = APIRouter(prefix="/preset", tags=["preset"])


@preset_router.post("", response_model=PresetDetailDTO)
def add_preset_route(
    dto: AddPresetDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token),
):
    return add_preset_service(dto, db)


@preset_router.get("", response_model=list[PresetDTO])
def get_preset_list_route(db: Session = Depends(get_db)):
    return get_preset_list_service(db)


@preset_router.get("/{preset_id}", response_model=PresetDetailDTO)
async def get_preset_detail_route(preset_id: int, db: Session = Depends(get_db)):
    return await get_preset_detail_service(preset_id, db)


@preset_router.patch("/{preset_id}", response_model=PresetDetailDTO)
def update_preset_route(
    preset_id: int,
    dto: UpdatePresetDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token),
):
    return update_preset_service(preset_id, dto, db)


@preset_router.delete("/{preset_id}", status_code=204)
def delete_preset_route(
    preset_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_token),
):
    return delete_preset_service(preset_id, db)
