import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.base_dto import BaseResponseDTO
from shared.dtos.preset_user_position_dto import (
    AddPresetUserPositionRequestDTO,
    DeletePresetUserPositionRequestDTO,
    GetPresetUserPositionResponseDTO,
)

from ..services.preset_user_position_service import (
    add_preset_user_position_service,
    delete_preset_user_position_service,
)


logger = logging.getLogger(__name__)

preset_user_position_router = APIRouter(
    prefix="/preset_user_position", tags=["preset_user_position"]
)


@preset_user_position_router.post("", response_model=GetPresetUserPositionResponseDTO)
def add_preset_user_position(
    dto: AddPresetUserPositionRequestDTO, db: Session = Depends(get_db)
):
    logger.info(f"Add: {dto.position_id} -> {dto.preset_user_id}")
    return add_preset_user_position_service(dto, db)


@preset_user_position_router.delete("", response_model=BaseResponseDTO)
def delete_preset_user_position(
    dto: DeletePresetUserPositionRequestDTO, db: Session = Depends(get_db)
):
    logger.info(f"Delete: {dto.preset_user_position_id}")
    return delete_preset_user_position_service(dto, db)
