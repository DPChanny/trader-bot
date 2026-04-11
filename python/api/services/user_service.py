from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user_dto import UserDetailDTO
from shared.repositories.user_repository import UserRepository

from ..utils.exception import service_exception_handler


@service_exception_handler
async def get_my_user_service(discord_id: int, session: AsyncSession) -> UserDetailDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_detail_by_id(discord_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDetailDTO.model_validate(user)
