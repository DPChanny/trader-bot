from __future__ import annotations

from sqlalchemy import select

from ..entities.discord_user import DiscordUser
from . import BaseRepository


class DiscordUserRepository(BaseRepository[DiscordUser]):
    async def get_by_id(self, discord_id: int) -> DiscordUser | None:
        result = await self.session.execute(
            select(DiscordUser).where(DiscordUser.discord_id == discord_id)
        )
        return result.scalar_one_or_none()
