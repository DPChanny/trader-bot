from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from shared.entities import BaseEntity


class BaseRepository[T: BaseEntity]:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def add(self, entity: T) -> None:
        self.db.add(entity)

    async def delete(self, entity: T) -> None:
        await self.db.delete(entity)

    async def commit(self) -> None:
        await self.db.commit()

    async def flush(self) -> None:
        await self.db.flush()

    async def refresh(self, entity: T) -> None:
        await self.db.refresh(entity)
