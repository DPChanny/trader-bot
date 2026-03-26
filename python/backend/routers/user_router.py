from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.user_dto import (
    AddUserDTO,
    UpdateUserDTO,
    UserDTO,
)
from shared.utils.database import get_db

from ..services.user_service import (
    add_user_service,
    delete_user_service,
    get_user_detail_service,
    get_user_list_service,
    update_profile_service,
    update_user_service,
)
from ..utils.bucket import get_bucket
from ..utils.token import Payload, verify_token


user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.post("", response_model=UserDTO)
async def add_user_route(
    dto: AddUserDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
    bucket: Any = Depends(get_bucket),
):
    return await add_user_service(dto, db, bucket, payload)


@user_router.get("", response_model=list[UserDTO])
async def get_user_list_route(
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await get_user_list_service(db, payload)


@user_router.get("/{user_id}", response_model=UserDTO)
async def get_user_detail_route(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return await get_user_detail_service(user_id, db, payload)


@user_router.patch("/{user_id}", response_model=UserDTO)
async def update_user_route(
    user_id: int,
    dto: UpdateUserDTO,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
    bucket: Any = Depends(get_bucket),
):
    return await update_user_service(user_id, dto, db, bucket, payload)


@user_router.post("/{user_id}/profile", response_model=UserDTO)
async def update_profile_route(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
    bucket: Any = Depends(get_bucket),
):
    return await update_profile_service(user_id, db, bucket, payload)


@user_router.delete("/{user_id}", status_code=204)
async def delete_user_route(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
    bucket: Any = Depends(get_bucket),
):
    return await delete_user_service(user_id, db, bucket, payload)
