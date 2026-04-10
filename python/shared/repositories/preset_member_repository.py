from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from shared.entities.member import Member
from shared.entities.preset import Preset
from shared.entities.preset_member import PresetMember

from .base_repository import BaseRepository


class PresetMemberRepository(BaseRepository[PresetMember]):
    async def get_by_id(
        self, preset_member_id: int, preset_id: int, guild_id: int
    ) -> PresetMember | None:
        result = await self.db.execute(
            select(PresetMember)
            .join(Preset)
            .where(
                PresetMember.preset_member_id == preset_member_id,
                PresetMember.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_detail_by_id(
        self,
        preset_member_id: int,
        preset_id: int,
        guild_id: int,
    ) -> PresetMember | None:
        result = await self.db.execute(
            select(PresetMember)
            .options(
                joinedload(PresetMember.member).joinedload(Member.discord_user),
                joinedload(PresetMember.member).joinedload(Member.guild),
                selectinload(PresetMember.preset_member_positions),
            )
            .join(Preset)
            .where(
                PresetMember.preset_member_id == preset_member_id,
                PresetMember.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.unique().scalar_one_or_none()

    async def get_by_discord_user_id(
        self, discord_user_id: int, preset_id: int, guild_id: int
    ) -> PresetMember | None:
        result = await self.db.execute(
            select(PresetMember)
            .join(PresetMember.member)
            .join(Preset, PresetMember.preset_id == Preset.preset_id)
            .where(
                PresetMember.preset_id == preset_id,
                Member.discord_user_id == discord_user_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()
