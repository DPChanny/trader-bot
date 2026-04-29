from discord import User as DiscordUser
from sqlalchemy.ext.asyncio import AsyncSession

from shared.dtos.user import UserDTO
from shared.repositories.user_repository import UserRepository


async def sync_user(user: DiscordUser, session: AsyncSession) -> UserDTO:
    repo = UserRepository(session)
    entity = await repo.upsert(
        user.id, user.global_name or user.name, user.avatar.key if user.avatar else None
    )
    return UserDTO.model_validate(entity)
