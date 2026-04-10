from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..entities.lol_stat import LolStat
from . import BaseRepository


class LolStatRepository(BaseRepository[LolStat]):
    async def get_by_member_id(self, member_id: int) -> LolStat | None:
        result = await self.session.execute(
            select(LolStat)
            .options(joinedload(LolStat.champions))
            .where(LolStat.member_id == member_id)
        )
        return result.unique().scalar_one_or_none()
