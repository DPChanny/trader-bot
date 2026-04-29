from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..entities import Guild, Member
from . import BaseRepository


class GuildRepository(BaseRepository):
    async def upsert(self, discord_id: int, name: str, icon_hash: str | None) -> Guild:
        stmt = pg_insert(Guild).values(
            discord_id=discord_id, name=name, icon_hash=icon_hash
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["discord_id"],
            set_={"name": stmt.excluded.name, "icon_hash": stmt.excluded.icon_hash},
        ).returning(Guild)
        result = await self.session.execute(stmt)
        return result.scalars().one()

    async def get_by_id(self, guild_id: int) -> Guild | None:
        result = await self.session.execute(
            select(Guild).where(Guild.discord_id == guild_id)
        )
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Guild]:
        result = await self.session.execute(select(Guild))
        return list(result.scalars().all())

    async def get_all_by_user_id(self, user_id: int) -> list[Guild]:
        result = await self.session.execute(
            select(Guild)
            .join(Member, Member.guild_id == Guild.discord_id)
            .where(Member.user_id == user_id)
        )
        return list(result.unique().scalars().all())
