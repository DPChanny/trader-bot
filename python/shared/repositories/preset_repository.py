from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from ..entities.member import Member
from ..entities.preset import Preset
from ..entities.preset_member import PresetMember
from .base_repository import BaseRepository


class PresetRepository(BaseRepository[Preset]):
    async def get_by_id(self, preset_id: int, guild_id: int) -> Preset | None:
        result = await self.db.execute(
            select(Preset).where(
                Preset.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(
        self,
        preset_id: int,
        guild_id: int,
    ) -> Preset | None:
        result = await self.db.execute(
            select(Preset)
            .options(
                joinedload(Preset.guild),
                selectinload(Preset.preset_members)
                .joinedload(PresetMember.member)
                .joinedload(Member.discord_user),
                selectinload(Preset.preset_members)
                .joinedload(PresetMember.member)
                .joinedload(Member.guild),
                selectinload(Preset.preset_members).selectinload(
                    PresetMember.preset_member_positions
                ),
                selectinload(Preset.tiers),
                selectinload(Preset.positions),
            )
            .where(
                Preset.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.unique().scalar_one_or_none()

    async def get_all_by_guild(self, guild_id: int) -> list[Preset]:
        result = await self.db.execute(
            select(Preset).where(Preset.guild_id == guild_id)
        )
        return list(result.scalars().all())
