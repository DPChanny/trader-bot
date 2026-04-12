from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.user import User
from ..repositories.user_repository import UserRepository


async def upsert_user(
    discord_id: int,
    name: str,
    avatar_hash: str | None,
    session: AsyncSession,
) -> None:
    repo = UserRepository(session)
    entity = await repo.get_by_id(discord_id)
    if entity is None:
        repo.add(User(discord_id=discord_id, name=name, avatar_hash=avatar_hash))
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
