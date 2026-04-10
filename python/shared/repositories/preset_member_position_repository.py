from __future__ import annotations

from sqlalchemy import select

from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember
from shared.entities.preset_member_position import PresetMemberPosition

from .base_repository import BaseRepository


class PresetMemberPositionRepository(BaseRepository[PresetMemberPosition]):
    async def get_by_id(
        self,
        preset_member_position_id: int,
        preset_member_id: int,
        guild_id: int,
    ) -> PresetMemberPosition | None:
        result = await self.db.execute(
            select(PresetMemberPosition)
            .join(
                PresetMember,
                PresetMemberPosition.preset_member_id == PresetMember.preset_member_id,
            )
            .join(Preset, PresetMember.preset_id == Preset.preset_id)
            .where(
                PresetMemberPosition.preset_member_position_id
                == preset_member_position_id,
                PresetMemberPosition.preset_member_id == preset_member_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_composite(
        self, preset_member_id: int, position_id: int
    ) -> PresetMemberPosition | None:
        result = await self.db.execute(
            select(PresetMemberPosition).where(
                PresetMemberPosition.preset_member_id == preset_member_id,
                PresetMemberPosition.position_id == position_id,
            )
        )
        return result.scalar_one_or_none()
