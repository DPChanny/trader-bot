from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from ..entities import BaseEntity


class BaseRepository[T: BaseEntity]:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    def add(self, entity: T) -> None:
        self.session.add(entity)

    async def delete(self, entity: T) -> None:
        await self.session.delete(entity)

    async def commit(self) -> None:
        await self.session.commit()

    async def flush(self) -> None:
        await self.session.flush()

    async def refresh(self, entity: T) -> None:
        await self.session.refresh(entity)
