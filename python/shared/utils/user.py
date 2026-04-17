from sqlalchemy.ext.asyncio import AsyncSession

from ..dtos.user import UserDTO
from ..entities.user import User
from ..repositories.user_repository import UserRepository


async def upsert_user(
    discord_id: int, name: str, avatar_hash: str | None, session: AsyncSession
) -> UserDTO:
    repo = UserRepository(session)
    entity = await repo.get_by_id(discord_id)
    if entity is None:
        session.add(User(discord_id=discord_id, name=name, avatar_hash=avatar_hash))
        await session.flush()
        entity = await repo.get_by_id(discord_id)
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash

    return UserDTO.model_validate(entity)
