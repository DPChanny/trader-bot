from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDetailDTO, UserDTO
from shared.entities import Billing, Payment
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


@http_service
async def delete_my_user_service(user_id: int, session: AsyncSession) -> None:
    await session.execute(delete(Payment).where(Payment.user_id == user_id))
    await session.execute(delete(Billing).where(Billing.user_id == user_id))
