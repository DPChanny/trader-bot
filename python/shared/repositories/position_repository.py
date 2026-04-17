from __future__ import annotations

from sqlalchemy import select

from ..entities.position import Position
from ..entities.preset import Preset
from . import BaseRepository


class PositionRepository(BaseRepository):
    async def get_all_by_preset_id(
        self, preset_id: int, guild_id: int
    ) -> list[Position]:
        result = await self.session.execute(
            select(Position)
            .join(Preset)
            .where(
                Position.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return list(result.scalars().all())

    async def get_by_id(
        self, position_id: int, preset_id: int, guild_id: int
    ) -> Position | None:
        result = await self.session.execute(
            select(Position)
            .join(Preset)
            .where(
                Position.position_id == position_id,
                Position.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()
