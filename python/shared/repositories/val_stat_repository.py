from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..entities.val_stat import ValStat
from . import BaseRepository


class ValStatRepository(BaseRepository[ValStat]):
    async def get_by_member_id(self, member_id: int) -> ValStat | None:
        result = await self.db.execute(
            select(ValStat)
            .options(joinedload(ValStat.agents))
            .where(ValStat.member_id == member_id)
        )
        return result.unique().scalar_one_or_none()
