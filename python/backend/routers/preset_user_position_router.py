from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.preset_user_position_dto import (
    AddPresetUserPositionDTO,
    DeletePresetUserPositionDTO,
    PresetUserPositionDTO,
)
from shared.utils.database import get_db

from ..services.preset_user_position_service import (
    add_preset_user_position_service,
    delete_preset_user_position_service,
)
from ..utils.token import Payload, verify_token


preset_user_position_router = APIRouter(
    prefix="/preset_user_position", tags=["preset_user_position"]
)


@preset_user_position_router.post("", response_model=PresetUserPositionDTO)
def add_preset_user_position_route(
    dto: AddPresetUserPositionDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return add_preset_user_position_service(dto, db, payload)


@preset_user_position_router.delete("", status_code=204)
def delete_preset_user_position_route(
    dto: DeletePresetUserPositionDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return delete_preset_user_position_service(dto, db, payload)
