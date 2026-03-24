import logging

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.preset_user_dto import (
    AddPresetUserRequestDTO,
    PresetUserDetailDTO,
    PresetUserDTO,
    UpdatePresetUserRequestDTO,
)

from ..services.preset_user_service import (
    add_preset_user_service,
    delete_preset_user_service,
    get_preset_user_detail_service,
    get_preset_user_list_service,
    update_preset_user_service,
)
from ..utils.auth import verify_admin_token


logger = logging.getLogger(__name__)

preset_user_router = APIRouter(prefix="/preset_user", tags=["preset_user"])


@preset_user_router.post("", response_model=PresetUserDetailDTO)
async def add_preset_user_route(
    dto: AddPresetUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info("Add")
    return await add_preset_user_service(dto, db)


@preset_user_router.get("", response_model=list[PresetUserDTO])
def get_preset_user_list_route(db: Session = Depends(get_db)):
    logger.info("Get list")
    return get_preset_user_list_service(db)


@preset_user_router.get("/{preset_user_id}", response_model=PresetUserDetailDTO)
async def get_preset_user_detail_route(
    preset_user_id: int, db: Session = Depends(get_db)
):
    logger.info(f"Get: {preset_user_id}")
    return await get_preset_user_detail_service(preset_user_id, db)


@preset_user_router.patch("/{preset_user_id}", response_model=PresetUserDetailDTO)
async def update_preset_user_route(
    preset_user_id: int,
    dto: UpdatePresetUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Update: {preset_user_id}")
    return await update_preset_user_service(preset_user_id, dto, db)


@preset_user_router.delete("/{preset_user_id}", status_code=204)
def delete_preset_user_route(
    preset_user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
):
    logger.info(f"Delete: {preset_user_id}")
    delete_preset_user_service(preset_user_id, db)
    return Response(status_code=204)
