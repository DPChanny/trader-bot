from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..entities.member import Member
from . import BaseRepository


class MemberRepository(BaseRepository[Member]):
    async def get_by_id(self, member_id: int, guild_id: int) -> Member | None:
        result = await self.db.execute(
            select(Member).where(
                Member.member_id == member_id,
                Member.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(self, member_id: int, guild_id: int) -> Member | None:
        result = await self.db.execute(
            select(Member)
            .options(
                selectinload(Member.discord_user),
                selectinload(Member.guild),
            )
            .where(
                Member.member_id == member_id,
                Member.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_discord_user_id(
        self, discord_user_id: int, guild_id: int
    ) -> Member | None:
        result = await self.db.execute(
            select(Member).where(
                Member.discord_user_id == discord_user_id,
                Member.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_all_by_guild(self, guild_id: int) -> list[Member]:
        result = await self.db.execute(
            select(Member)
            .options(
                selectinload(Member.discord_user),
                selectinload(Member.guild),
            )
            .where(Member.guild_id == guild_id)
        )
        return list(result.scalars().all())
