from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from ..entities import User
from . import CHUNK_SIZE, BaseRepository


class UserRepository(BaseRepository):
    async def upsert(self, discord_id: int, name: str, avatar_hash: str | None) -> User:
        stmt = pg_insert(User).values(
            discord_id=discord_id, name=name, avatar_hash=avatar_hash
        )
        stmt = stmt.on_conflict_do_update(
            index_elements=["discord_id"],
            set_={"name": stmt.excluded.name, "avatar_hash": stmt.excluded.avatar_hash},
        ).returning(User)
        result = await self.session.execute(stmt)
        return result.scalars().one()

    async def bulk_upsert(self, rows: list[dict]) -> None:
        for i in range(0, len(rows), CHUNK_SIZE):
            chunk = rows[i : i + CHUNK_SIZE]
            stmt = pg_insert(User).values(chunk)
            stmt = stmt.on_conflict_do_update(
                index_elements=["discord_id"],
                set_={
                    "name": stmt.excluded.name,
                    "avatar_hash": stmt.excluded.avatar_hash,
                },
            )
            await self.session.execute(stmt)

    async def get_by_id(self, discord_id: int) -> User | None:
        result = await self.session.execute(
            select(User).where(User.discord_id == discord_id)
        )
        return result.scalar_one_or_none()
