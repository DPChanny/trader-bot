from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..entities import Member
from . import BaseRepository


class MemberRepository(BaseRepository):
    async def get_by_id(self, member_id: int, guild_id: int) -> Member | None:
        result = await self.session.execute(
            select(Member).where(
                Member.member_id == member_id, Member.guild_id == guild_id
            )
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(self, member_id: int, guild_id: int) -> Member | None:
        result = await self.session.execute(
            select(Member)
            .options(selectinload(Member.user))
            .where(Member.member_id == member_id, Member.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(self, user_id: int, guild_id: int) -> Member | None:
        result = await self.session.execute(
            select(Member).where(Member.user_id == user_id, Member.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_detail_by_user_id(self, user_id: int, guild_id: int) -> Member | None:
        result = await self.session.execute(
            select(Member)
            .options(selectinload(Member.user))
            .where(Member.user_id == user_id, Member.guild_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_all_by_guild_id(self, guild_id: int) -> list[Member]:
        result = await self.session.execute(
            select(Member)
            .options(selectinload(Member.user))
            .where(Member.guild_id == guild_id)
        )
        return list(result.scalars().all())
