from __future__ import annotations

from sqlalchemy import select

from ..entities.user import User
from . import BaseRepository


class UserRepository(BaseRepository[User]):
    async def get_by_id(self, discord_id: int) -> User | None:
        result = await self.session.execute(
            select(User).where(User.discord_id == discord_id)
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(self, discord_id: int) -> User | None:
        result = await self.session.execute(
            select(User).where(User.discord_id == discord_id)
        )
        return result.scalar_one_or_none()
