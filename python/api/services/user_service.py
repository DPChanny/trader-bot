from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDetailDTO
from shared.repositories.user_repository import UserRepository
from shared.utils.error import HTTPError, UserErrorCode
from shared.utils.service import http_service


@http_service
async def get_my_user_service(user_id: int, session: AsyncSession) -> UserDetailDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise HTTPError(UserErrorCode.NotFound)
    return UserDetailDTO.model_validate(user)
