import logging
from types import NoneType
from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.database import get_db
from shared.dtos.base_dto import BaseResponseDTO
from shared.dtos.user_dto import (
    AddUserRequestDTO,
    GetUserDetailResponseDTO,
    GetUserListResponseDTO,
    UpdateUserRequestDTO,
)

from ..services.user_service import (
    add_user_service,
    delete_user_service,
    get_user_detail_service,
    get_user_list_service,
    update_profile_service,
    update_user_service,
)
from ..utils.auth import verify_admin_token
from ..utils.bucket import get_bucket


logger = logging.getLogger(__name__)

user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.post("", response_model=GetUserDetailResponseDTO)
async def add_user_route(
    dto: AddUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
    bucket: Any = Depends(get_bucket),
):
    logger.info(f"Adding: {dto.name}")
    return await add_user_service(dto, db, bucket)


@user_router.get("", response_model=GetUserListResponseDTO)
async def get_user_list_route(db: Session = Depends(get_db)):
    logger.info("Fetching list")
    return await get_user_list_service(db)


@user_router.get("/{user_id}", response_model=GetUserDetailResponseDTO)
async def get_user_detail_route(user_id: int, db: Session = Depends(get_db)):
    logger.info(f"Fetching: {user_id}")
    return await get_user_detail_service(user_id, db)


@user_router.patch("/{user_id}", response_model=GetUserDetailResponseDTO)
async def update_user_route(
    user_id: int,
    dto: UpdateUserRequestDTO,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
    bucket: Any = Depends(get_bucket),
):
    logger.info(f"Updating: {user_id}")
    return await update_user_service(user_id, dto, db, bucket)


@user_router.post("/{user_id}/discord-profile", response_model=GetUserDetailResponseDTO)
async def update_profile_route(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
    bucket: Any = Depends(get_bucket),
):
    logger.info(f"Updating profile: {user_id}")
    return await update_profile_service(user_id, db, bucket)


@user_router.delete("/{user_id}", response_model=BaseResponseDTO[NoneType])
async def delete_user_route(
    user_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(verify_admin_token),
    bucket: Any = Depends(get_bucket),
):
    logger.info(f"Deleting: {user_id}")
    return await delete_user_service(user_id, db, bucket)
