from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user_dto import UserDetailDTO
from shared.error import AppError, User, service_error_handler
from shared.repositories.user_repository import UserRepository


@service_error_handler
async def get_my_user_service(user_id: int, session: AsyncSession) -> UserDetailDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise AppError(User.NotFound)
    return UserDetailDTO.model_validate(user)
