from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.preset_member_position_dto import (
    AddPresetMemberPositionDTO,
    DeletePresetMemberPositionDTO,
    PresetMemberPositionDTO,
)
from shared.utils.database import get_db

from ..services.preset_member_position_service import (
    add_preset_member_position_service,
    delete_preset_member_position_service,
)
from ..utils.token import Payload, verify_token


preset_member_position_router = APIRouter(
    prefix="/preset_member_position", tags=["preset_member_position"]
)


@preset_member_position_router.post("", response_model=PresetMemberPositionDTO)
def add_preset_member_position_route(
    dto: AddPresetMemberPositionDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return add_preset_member_position_service(dto, db, payload)


@preset_member_position_router.delete("", status_code=204)
def delete_preset_member_position_route(
    dto: DeletePresetMemberPositionDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return delete_preset_member_position_service(dto, db, payload)
