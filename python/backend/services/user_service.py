from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDetailDTO, UserDTO
from shared.repositories.user_repository import UserRepository
from shared.utils.error import HTTPError, UserErrorCode
from shared.utils.service import Event, http_service


@http_service
async def get_my_user_service(
    user_id: int, session: AsyncSession, event: Event
) -> UserDetailDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise HTTPError(UserErrorCode.NotFound)
    event.result = UserDTO.model_validate(user)
    return UserDetailDTO.model_validate(user)
