from sqlalchemy import delete, func, or_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload

from ..entities import Member, User
from . import CHUNK_SIZE, BaseRepository


class MemberRepository(BaseRepository):
    async def upsert(
        self,
        guild_id: int,
        user_id: int,
        name: str | None,
        avatar_hash: str | None,
        role: int,
    ) -> Member:
        stmt = pg_insert(Member).values(
            guild_id=guild_id,
            user_id=user_id,
            name=name,
            avatar_hash=avatar_hash,
            role=role,
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["guild_id", "user_id"],
            set_={
                "name": stmt.excluded.name,
                "avatar_hash": stmt.excluded.avatar_hash,
                "role": func.greatest(stmt.excluded.role, Member.role),
            },
        ).returning(Member)
        result = await self.session.execute(stmt)
        return result.scalars().one()

    async def bulk_upsert(self, rows: list[dict]) -> None:
        for i in range(0, len(rows), CHUNK_SIZE):
            chunk = rows[i : i + CHUNK_SIZE]
            stmt = pg_insert(Member).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=["guild_id", "user_id"],
                set_={
                    "name": stmt.excluded.name,
                    "avatar_hash": stmt.excluded.avatar_hash,
                    "role": func.greatest(stmt.excluded.role, Member.role),
                },
            )
            await self.session.execute(stmt)

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

    async def get_all_by_guild_id(
        self, guild_id: int, search: str | None = None, cursor: int | None = None
    ) -> list[Member]:
        stmt = (
            select(Member)
            .options(selectinload(Member.user))
            .where(Member.guild_id == guild_id)
        )
        if search:
            stmt = stmt.join(Member.user).where(
                or_(
                    Member.alias.ilike(f"%{search}%"),
                    Member.name.ilike(f"%{search}%"),
                    User.name.ilike(f"%{search}%"),
                )
            )
        if cursor is not None:
            stmt = stmt.where(Member.member_id > cursor)
        stmt = stmt.order_by(Member.member_id).limit(50)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
