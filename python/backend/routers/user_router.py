from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from shared.dtos.guild_manager_dto import UserDTO
from shared.utils.database import get_db

from ..services.user_service import (
    delete_user_service,
    get_user_detail_service,
    get_user_list_service,
)
from ..utils.token import Payload, verify_token


user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.get("", response_model=list[UserDTO])
def get_user_list_route(
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_user_list_service(db, payload)


@user_router.get("/{user_id}", response_model=UserDTO)
def get_user_detail_route(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_user_detail_service(user_id, db, payload)


@user_router.delete("/{user_id}", status_code=204)
def delete_user_route(
    user_id: int,
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return delete_user_service(user_id, db, payload)
