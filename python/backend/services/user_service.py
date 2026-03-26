from fastapi import HTTPException
from loguru import logger
from sqlalchemy.orm import Session

from shared.dtos.guild_manager_dto import UserDTO
from shared.entities.user import User
from shared.utils.exception import service_exception_handler

from ..utils.token import Payload


@service_exception_handler
def get_user_list_service(db: Session, payload: Payload) -> list[UserDTO]:
    users = db.query(User).all()
    return [UserDTO.model_validate(u) for u in users]


@service_exception_handler
def get_user_detail_service(user_id: int, db: Session, payload: Payload) -> UserDTO:
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        logger.warning(f"User not found: user_id={user_id}")
        raise HTTPException(status_code=404, detail="User not found")
    return UserDTO.model_validate(user)


@service_exception_handler
def delete_user_service(user_id: int, db: Session, payload: Payload) -> None:
    if user_id == payload.user_id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = db.query(User).filter(User.user_id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    logger.info(f"User deleted: user_id={user_id}")
