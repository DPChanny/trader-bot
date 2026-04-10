from sqlalchemy.ext.asyncio import AsyncSession

from ..entities.discord_user import DiscordUser
from ..repositories.discord_user_repository import DiscordUserRepository


async def upsert_discord_user(
    discord_id: int,
    name: str,
    avatar_hash: str | None,
    session: AsyncSession,
) -> None:
    repo = DiscordUserRepository(session)
    entity = await repo.get_by_id(discord_id)
    if entity is None:
        repo.add(DiscordUser(discord_id=discord_id, name=name, avatar_hash=avatar_hash))
    else:
        entity.name = name
        entity.avatar_hash = avatar_hash
