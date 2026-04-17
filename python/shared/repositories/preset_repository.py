from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from ..entities.member import Member
from ..entities.preset import Preset
from ..entities.preset_member import PresetMember
from ..entities.preset_member_position import PresetMemberPosition
from . import BaseRepository


class PresetRepository(BaseRepository):
    async def get_by_id(self, preset_id: int, guild_id: int) -> Preset | None:
        result = await self.session.execute(
            select(Preset).where(
                Preset.preset_id == preset_id, Preset.guild_id == guild_id
            )
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(self, preset_id: int, guild_id: int) -> Preset | None:
        result = await self.session.execute(
            select(Preset)
            .options(
                joinedload(Preset.guild),
                selectinload(Preset.preset_members).options(
                    joinedload(PresetMember.member).options(joinedload(Member.user)),
                    joinedload(PresetMember.tier),
                    selectinload(PresetMember.preset_member_positions).joinedload(
                        PresetMemberPosition.position
                    ),
                ),
            )
            .where(Preset.preset_id == preset_id, Preset.guild_id == guild_id)
        )
        return result.unique().scalar_one_or_none()

    async def get_all_by_guild_id(self, guild_id: int) -> list[Preset]:
        result = await self.session.execute(
            select(Preset).where(Preset.guild_id == guild_id)
        )
        return list(result.scalars().all())
