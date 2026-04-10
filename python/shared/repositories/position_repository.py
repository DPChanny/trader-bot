from __future__ import annotations

from sqlalchemy import select

from shared.entities.position import Position
from shared.entities.preset import Preset

from .base_repository import BaseRepository


class PositionRepository(BaseRepository[Position]):
    async def get_by_id(
        self, position_id: int, preset_id: int, guild_id: int
    ) -> Position | None:
        result = await self.db.execute(
            select(Position)
            .join(Preset)
            .where(
                Position.position_id == position_id,
                Position.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()
