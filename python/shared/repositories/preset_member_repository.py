from sqlalchemy import or_, select
from sqlalchemy.orm import joinedload, selectinload

from ..entities import Member, Preset, PresetMember, PresetMemberPosition, User
from . import BaseRepository


class PresetMemberRepository(BaseRepository):
    async def get_all_detail_by_preset_id(
        self,
        preset_id: int,
        guild_id: int,
        search: str | None = None,
        cursor: int | None = None,
    ) -> list[PresetMember]:
        stmt = (
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
        if search:
            stmt = (
                stmt.join(PresetMember.member)
                .join(Member.user)
                .where(
                    or_(
                        Member.alias.ilike(f"%{search}%"),
                        Member.name.ilike(f"%{search}%"),
                        User.name.ilike(f"%{search}%"),
                    )
                )
            )
        if cursor is not None:
            stmt = stmt.where(PresetMember.preset_member_id > cursor)
        stmt = stmt.order_by(PresetMember.preset_member_id).limit(50)
        result = await self.session.execute(stmt)
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
