from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import joinedload

from ..entities.preset import Preset
from ..entities.preset_member import PresetMember
from ..entities.preset_member_position import PresetMemberPosition
from . import BaseRepository


class PresetMemberPositionRepository(BaseRepository):
    async def get_by_id(
        self,
        preset_member_position_id: int,
        preset_member_id: int,
        preset_id: int,
        guild_id: int,
    ) -> PresetMemberPosition | None:
        result = await self.session.execute(
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
                PresetMember.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(
        self,
        preset_member_position_id: int,
        preset_member_id: int,
        preset_id: int,
        guild_id: int,
    ) -> PresetMemberPosition | None:
        result = await self.session.execute(
            select(PresetMemberPosition)
            .options(joinedload(PresetMemberPosition.position))
            .join(
                PresetMember,
                PresetMemberPosition.preset_member_id == PresetMember.preset_member_id,
            )
            .join(Preset, PresetMember.preset_id == Preset.preset_id)
            .where(
                PresetMemberPosition.preset_member_position_id
                == preset_member_position_id,
                PresetMemberPosition.preset_member_id == preset_member_id,
                PresetMember.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()
