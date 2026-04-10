from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..entities.user import User
from .base_repository import BaseRepository


class UserRepository(BaseRepository[User]):
    async def get_by_id(self, discord_id: int) -> User | None:
        result = await self.db.execute(
            select(User).where(User.discord_id == discord_id)
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(self, discord_id: int) -> User | None:
        result = await self.db.execute(
            select(User)
            .options(selectinload(User.discord_user))
            .where(User.discord_id == discord_id)
        )
        return result.scalar_one_or_none()
