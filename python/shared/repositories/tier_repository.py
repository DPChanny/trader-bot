from __future__ import annotations

from sqlalchemy import select

from ..entities.preset import Preset
from ..entities.tier import Tier
from . import BaseRepository


class TierRepository(BaseRepository):
    async def get_all_by_preset_id(self, preset_id: int, guild_id: int) -> list[Tier]:
        result = await self.session.execute(
            select(Tier)
            .join(Preset)
            .where(Tier.preset_id == preset_id, Preset.guild_id == guild_id)
        )
        return list(result.scalars().all())

    async def get_by_id(
        self, tier_id: int, preset_id: int, guild_id: int
    ) -> Tier | None:
        result = await self.session.execute(
            select(Tier)
            .join(Preset)
            .where(
                Tier.tier_id == tier_id,
                Tier.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()
