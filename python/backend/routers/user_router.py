from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from shared.dtos.user_dto import UserDTO
from shared.utils.database import get_db

from ..services.user_service import (
    delete_me_service,
    get_me_service,
    get_user_by_discord_id_service,
)
from ..utils.token import Payload, verify_token


user_router = APIRouter(prefix="/user", tags=["user"])


@user_router.get("/me", response_model=UserDTO)
def get_me_route(
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_me_service(db, payload)


@user_router.get("", response_model=UserDTO)
def get_user_by_discord_id_route(
    discord_id: str = Query(),
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return get_user_by_discord_id_service(discord_id, db, payload)


@user_router.delete("/me", status_code=204)
def delete_me_route(
    db: Session = Depends(get_db),
    payload: Payload = Depends(verify_token),
):
    return delete_me_service(db, payload)
