from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user_dto import UserDTO
from shared.error import AppError, User
from shared.repositories.user_repository import UserRepository

from ..utils.exception import service_exception_handler


@service_exception_handler
async def get_my_user_service(user_id: int, session: AsyncSession) -> UserDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise AppError(User.NotFound)
    return UserDTO.model_validate(user)
