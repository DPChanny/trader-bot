from __future__ import annotations

from sqlalchemy import select

from ..entities.session import Session
from . import BaseRepository


class SessionRepository(BaseRepository[Session]):
    async def get_by_jti(self, jti: str) -> Session | None:
        result = await self.session.execute(select(Session).where(Session.jti == jti))
        return result.scalar_one_or_none()
