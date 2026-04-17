from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDetailDTO
from shared.repositories.user_repository import UserRepository
from shared.utils.error import HTTPError, UserErrorCode
from shared.utils.service import Event, http_service, set_event_response


@http_service
async def get_my_user_service(
    user_id: int, session: AsyncSession, event: Event
) -> UserDetailDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    if user is None:
        raise HTTPError(UserErrorCode.NotFound)
    response = UserDetailDTO.model_validate(user)
    return set_event_response(event, response)
