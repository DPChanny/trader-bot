from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import joinedload, selectinload

from ..entities import Member, Preset, PresetMember, PresetMemberPosition
from . import BaseRepository


class PresetMemberRepository(BaseRepository):
    async def get_all_detail_by_preset_id(
        self, preset_id: int, guild_id: int
    ) -> list[PresetMember]:
        result = await self.session.execute(
            select(PresetMember)
            .options(
                joinedload(PresetMember.member).options(joinedload(Member.user)),
                joinedload(PresetMember.tier),
                selectinload(PresetMember.preset_member_positions).joinedload(
                    PresetMemberPosition.position
                ),
            )
            .join(Preset)
            .where(PresetMember.preset_id == preset_id, Preset.guild_id == guild_id)
        )
        return list(result.unique().scalars().all())

    async def get_by_id(
        self, preset_member_id: int, preset_id: int, guild_id: int
    ) -> PresetMember | None:
        result = await self.session.execute(
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
        self, preset_member_id: int, preset_id: int, guild_id: int
    ) -> PresetMember | None:
        result = await self.session.execute(
            select(PresetMember)
            .options(
                joinedload(PresetMember.member).options(joinedload(Member.user)),
                joinedload(PresetMember.tier),
                selectinload(PresetMember.preset_member_positions).joinedload(
                    PresetMemberPosition.position
                ),
            )
            .join(Preset)
            .where(
                PresetMember.preset_member_id == preset_member_id,
                PresetMember.preset_id == preset_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.unique().scalar_one_or_none()

    async def get_by_user_id(
        self, user_id: int, preset_id: int, guild_id: int
    ) -> PresetMember | None:
        result = await self.session.execute(
            select(PresetMember)
            .join(PresetMember.member)
            .join(Preset, PresetMember.preset_id == Preset.preset_id)
            .where(
                PresetMember.preset_id == preset_id,
                Member.user_id == user_id,
                Preset.guild_id == guild_id,
            )
        )
        return result.scalar_one_or_none()
