from fastapi import HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user_dto import UserDetailDTO
from shared.repositories.user_repository import UserRepository

from ..utils.exception import service_exception_handler
from ..utils.token import TokenPayload


@service_exception_handler
async def get_me_service(
    session: AsyncSession, token_payload: TokenPayload
) -> UserDetailDTO:
    user_repo = UserRepository(session)
    user = await user_repo.get_detail_by_id(token_payload.discord_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDetailDTO.model_validate(user)


@service_exception_handler
async def delete_me_service(session: AsyncSession, token_payload: TokenPayload) -> None:
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(token_payload.discord_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    await user_repo.delete(user)
    await user_repo.commit()
    logger.info(f"User deleted: discord_id={token_payload.discord_id}")
