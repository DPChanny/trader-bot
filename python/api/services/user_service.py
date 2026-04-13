from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user_dto import UserDetailDTO
from shared.repositories.user_repository import UserRepository
from shared.utils.error import AppError, UserErrorCode
from shared.utils.service import service


@service
async def get_my_user_service(user_id: int, session: AsyncSession) -> UserDetailDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise AppError(UserErrorCode.NotFound)
    return UserDetailDTO.model_validate(user)
